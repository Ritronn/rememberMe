from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import *
from .services.supabase_client import supabase, upload_file
from .services.voice_service import generate_audio_from_text
from .services.gemini_service import query_patient_memory
import uuid

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
    """Patient asks question - Gemini identifies family member"""
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
            return Response({'error': 'No family members found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Build context for Gemini
        context = "Family Members:\n"
        for member in members.data:
            context += f"- {member['name']}, {member['relationship']}\n"
        
        # Query Gemini
        gemini_result = query_patient_memory(query, context)
        
        if gemini_result['error']:
            raise Exception(gemini_result['error'])
        
        return Response({
            'gemini_response': gemini_result['response'],
            'family_members': members.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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