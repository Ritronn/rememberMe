from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import *
from .services.supabase_client import supabase, upload_file
from .services.voice_service import generate_audio_from_text
from .services.gemini_service import query_patient_memory
import uuid
from .services.image_recognition_service import identify_person_from_photo

@api_view(['POST'])
def register_family_member(request):
    serializer = FamilyMemberSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    
    try:
        # Insert into family_members table
        result = supabase.table('family_members').insert({
            'user_id': str(data['user_id']),
            'patient_id': str(data['patient_id']),
            'name': data['name'],
            'email': data['email'],
            'relationship': data['relationship'],
            'profile_photo_url': data.get('profile_photo_url'),
            'voice_clone_status': 'pending'
        }).execute()
        
        return Response({
            'family_member_id': result.data[0]['id'],
            'message': 'Family member registered successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def upload_voice(request):
    family_member_id = request.data.get('family_member_id')
    voice_sample_url = request.data.get('voice_sample_url')
    
    if not family_member_id or not voice_sample_url:
        return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Update database with voice URL
        supabase.table('family_members').update({
            'voice_sample_url': voice_sample_url,
            'voice_clone_status': 'ready'
        }).eq('id', family_member_id).execute()
        
        return Response({
            'message': 'Voice uploaded successfully',
            'voice_sample_url': voice_sample_url
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def create_memory(request):
    """Create memory with photos and generate audio"""
    serializer = MemoryCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    family_member_id = str(data['family_member_id'])
    
    try:
        # Get family member's voice_sample_url
        member = supabase.table('family_members').select('voice_sample_url, voice_clone_status').eq('id', family_member_id).execute()
        
        if not member.data or not member.data[0]['voice_sample_url']:
            return Response({'error': 'Voice not uploaded yet'}, status=status.HTTP_400_BAD_REQUEST)
        
        if member.data[0]['voice_clone_status'] != 'ready':
            return Response({'error': 'Voice processing not complete'}, status=status.HTTP_400_BAD_REQUEST)
        
        voice_sample_url = member.data[0]['voice_sample_url']
        
        # Insert memory
        memory_result = supabase.table('memories').insert({
            'family_member_id': family_member_id,
            'title': data['title'],
            'content': data['content']
        }).execute()
        
        memory_id = memory_result.data[0]['id']
        
        # Upload photos if provided
        if 'photos' in request.FILES:
            for photo in request.FILES.getlist('photos'):
                path = f"memory-photos/{memory_id}_{uuid.uuid4()}_{photo.name}"
                result = upload_file('profiles', path, photo.read())
                
                if result['url']:
                    supabase.table('memory_photos').insert({
                        'memory_id': memory_id,
                        'photo_url': result['url']
                    }).execute()
        
        # Generate audio with Coqui TTS
        audio_result = generate_audio_from_text(data['content'], voice_sample_url)
        
        if audio_result['error']:
            raise Exception(audio_result['error'])
        
        # Upload audio to Supabase
        audio_path = f"memory-audio/{memory_id}.wav"
        audio_upload = upload_file('memory-audio', audio_path, audio_result['audio'])
        
        if audio_upload['error']:
            raise Exception(audio_upload['error'])
        
        # Update memory with audio URL
        supabase.table('memories').update({
            'audio_url': audio_upload['url']
        }).eq('id', memory_id).execute()
        
        return Response({
            'memory_id': memory_id,
            'audio_url': audio_upload['url'],
            'message': 'Memory created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def patient_query(request):
    """Patient asks question - Gemini handles versatile queries"""
    serializer = PatientQuerySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    patient_id = str(data['patient_id'])
    query = data['query']
    
    try:
        # Get all family members for this patient
        members = supabase.table('family_members').select('*').eq('patient_id', patient_id).execute()
        
        if not members.data:
            return Response({
                'type': 'error',
                'answer': 'No family members found. Please ask your family to register first.',
                'show_memories': False
            }, status=status.HTTP_200_OK)
        
        # Get patient info (for non-family queries)
        patient_info_result = supabase.table('patient_info').select('*').eq('patient_id', patient_id).execute()
        patient_info = patient_info_result.data[0] if patient_info_result.data else None
        
        # Query Gemini with structured data
        gemini_result = query_patient_memory(query, members.data, patient_info)
        
        if gemini_result.get('error') and gemini_result['type'] == 'error':
            return Response({
                'type': 'error',
                'answer': gemini_result['answer'],
                'show_memories': False
            }, status=status.HTTP_200_OK)
        
        # Handle different query types
        
        # 1. SPECIFIC FAMILY MEMBER
        if gemini_result['type'] == 'family_member':
            family_member_id = gemini_result.get('family_member_id')
            
            if not family_member_id:
                return Response({
                    'type': 'error',
                    'answer': 'Could not identify the family member',
                    'show_memories': False
                }, status=status.HTTP_200_OK)
            
            # Get family member details
            member_result = supabase.table('family_members').select('*').eq('id', family_member_id).execute()
            
            if not member_result.data:
                return Response({
                    'type': 'error',
                    'answer': 'Family member not found',
                    'show_memories': False
                }, status=status.HTTP_200_OK)
            
            member = member_result.data[0]
            
            # Get all memories for this family member (only if show_memories=true)
            memories = []
            if gemini_result.get('show_memories', False):
                memories_result = supabase.table('memories').select('*').eq('family_member_id', family_member_id).order('created_at', desc=True).execute()
                
                # Get photos for each memory
                memories = memories_result.data or []
                for memory in memories:
                    photos_result = supabase.table('memory_photos').select('*').eq('memory_id', memory['id']).execute()
                    memory['photos'] = photos_result.data or []
            
            return Response({
                'type': 'family_member',
                'answer': gemini_result['answer'],
                'family_member': member,
                'memories': memories,
                'show_memories': gemini_result.get('show_memories', False)
            }, status=status.HTTP_200_OK)
        
        # 2. COUNT QUERY
        elif gemini_result['type'] == 'count':
            # Get full details of counted members
            member_ids = gemini_result.get('family_members', [])
            counted_members = []
            
            for member_id in member_ids:
                member_result = supabase.table('family_members').select('*').eq('id', member_id).execute()
                if member_result.data:
                    counted_members.append(member_result.data[0])
            
            return Response({
                'type': 'count',
                'answer': gemini_result['answer'],
                'count': gemini_result.get('count', len(counted_members)),
                'family_members': counted_members,
                'show_memories': False
            }, status=status.HTTP_200_OK)
        
        # 3. LIST ALL
        elif gemini_result['type'] == 'list_all':
            return Response({
                'type': 'list_all',
                'answer': gemini_result['answer'],
                'family_members': members.data,
                'show_memories': False
            }, status=status.HTTP_200_OK)
        
        # 4. PATIENT INFO
        elif gemini_result['type'] == 'patient_info':
            info_type = gemini_result.get('info_type')
            
            return Response({
                'type': 'patient_info',
                'info_type': info_type,
                'answer': gemini_result['answer'],
                'patient_info': patient_info,
                'show_memories': False
            }, status=status.HTTP_200_OK)
        
        # 5. GENERAL CONVERSATION
        elif gemini_result['type'] == 'conversation':
            return Response({
                'type': 'conversation',
                'answer': gemini_result['answer'],
                'show_memories': False
            }, status=status.HTTP_200_OK)
        
        # 6. UNCLEAR
        else:
            return Response({
                'type': 'unclear',
                'answer': gemini_result.get('answer', 'I did not understand that. Could you rephrase?'),
                'show_memories': False
            }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Patient query error: {e}")
        return Response({
            'type': 'error',
            'answer': 'Something went wrong. Please try again.',
            'show_memories': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
def get_family_members(request, patient_id):
    """Get all family members for a patient"""
    try:
        result = supabase.table('family_members').select('*').eq('patient_id', str(patient_id)).execute()
        return Response(result.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_memories(request, family_member_id):
    """Get all memories for a family member with photos"""
    try:
        # Get memories
        memories = supabase.table('memories').select('*').eq('family_member_id', str(family_member_id)).execute()
        
        # Get photos for each memory
        for memory in memories.data:
            photos = supabase.table('memory_photos').select('*').eq('memory_id', memory['id']).execute()
            memory['photos'] = photos.data
        
        return Response(memories.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['POST'])
def identify_from_photo(request):
    """Patient uploads photo - AI identifies who it is"""
    
    patient_id = request.data.get('patient_id')
    
    if not patient_id:
        return Response({'error': 'Missing patient_id'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if image file was uploaded
    if 'image' not in request.FILES:
        return Response({'error': 'No image uploaded'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get uploaded image
        image_file = request.FILES['image']
        image_bytes = image_file.read()
        
        # Get all family members for this patient
        members = supabase.table('family_members').select('*').eq('patient_id', str(patient_id)).execute()
        
        if not members.data:
            return Response({
                'match': 'unknown',
                'answer': 'No family members registered yet. Please ask your family to register first.',
                'confidence': 'none'
            }, status=status.HTTP_200_OK)
        
        # Call image recognition service
        result = identify_person_from_photo(image_bytes, members.data)
        
        if result.get('error') and result['match'] == 'error':
            return Response({
                'match': 'error',
                'answer': 'Sorry, I had trouble processing that image. Please try again.',
                'confidence': 'none'
            }, status=status.HTTP_200_OK)
        
        # Handle successful match
        if result['match'] == 'found':
            family_member_id = result['family_member_id']
            
            # Get family member details
            member_result = supabase.table('family_members').select('*').eq('id', family_member_id).execute()
            
            if not member_result.data:
                return Response({
                    'match': 'unknown',
                    'answer': 'I recognized someone but couldn\'t find their details.',
                    'confidence': 'none'
                }, status=status.HTTP_200_OK)
            
            member = member_result.data[0]
            
            # Get memories for this person
            memories_result = supabase.table('memories').select('*').eq('family_member_id', family_member_id).order('created_at', desc=True).execute()
            
            memories = memories_result.data or []
            for memory in memories:
                photos_result = supabase.table('memory_photos').select('*').eq('memory_id', memory['id']).execute()
                memory['photos'] = photos_result.data or []
            
            # Build answer
            confidence_text = ""
            if result['confidence'] == 'high':
                confidence_text = "I'm quite confident"
            elif result['confidence'] == 'medium':
                confidence_text = "I believe"
            else:
                confidence_text = "This might be"
            
            answer = f"{confidence_text} this is your {member['relationship']}, {member['name']}!"
            
            return Response({
                'match': 'found',
                'answer': answer,
                'confidence': result['confidence'],
                'family_member': member,
                'memories': memories,
                'show_memories': True
            }, status=status.HTTP_200_OK)
        
        # No match found
        else:
            return Response({
                'match': 'unknown',
                'answer': 'I couldn\'t identify this person from your family photos. Could you tell me who this is?',
                'confidence': result.get('confidence', 'none'),
                'reasoning': result.get('reasoning', '')
            }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Image identification error: {e}")
        return Response({
            'match': 'error',
            'answer': 'Sorry, something went wrong. Please try again.',
            'confidence': 'none',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)