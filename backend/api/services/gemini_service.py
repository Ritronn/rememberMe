import google.generativeai as genai
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-2.5-flash')

def query_patient_memory(query: str, family_members: list, patient_info: dict = None):
    """
    Query Gemini to handle VERSATILE patient questions
    
    Handles:
    - "Who is my daughter?" → specific family member
    - "How many sons do I have?" → count query
    - "Tell me about my family" → list all members
    - "What did I do with Sarah?" → memories with specific person
    - "Where is my home?" → patient info
    - General conversation
    
    Args:
        query: Patient's question
        family_members: List of family member dicts with id, name, relationship
        patient_info: Optional dict with patient's personal info
    
    Returns:
        {
            "type": "family_member" | "count" | "list_all" | "patient_info" | "conversation",
            "family_member_id": "uuid" (if specific member),
            "family_members": [...] (if list/count),
            "count": number (if count query),
            "answer": "Natural language response",
            "show_memories": true/false,
            "error": None
        }
    """
    try:
        # Build context
        context_parts = []
        
        # Add family members context
        if family_members:
            context_parts.append("FAMILY MEMBERS:")
            for member in family_members:
                context_parts.append(
                    f"- ID: {member['id']}, Name: {member['name']}, "
                    f"Relationship: {member['relationship']}"
                )
        
        # Add patient info context
        if patient_info:
            context_parts.append("\nPATIENT INFORMATION:")
            if patient_info.get('home_address'):
                context_parts.append(f"- Home: {patient_info['home_address']}")
            if patient_info.get('doctor_name'):
                context_parts.append(f"- Doctor: {patient_info['doctor_name']}")
            if patient_info.get('emergency_contacts'):
                context_parts.append(f"- Emergency Contacts: {len(patient_info['emergency_contacts'])} contacts")
        
        context = "\n".join(context_parts)
        
        # Create versatile prompt
        prompt = f"""You are a compassionate AI assistant helping an Alzheimer's patient remember their family and life.

CONTEXT:
{context}

PATIENT QUERY: "{query}"

INSTRUCTIONS:
Analyze the query and determine what the patient is asking for. Be conversational and warm.

RESPONSE TYPES:

1. SPECIFIC FAMILY MEMBER (e.g., "Who is my daughter?", "Tell me about Sarah")
{{
    "type": "family_member",
    "family_member_id": "exact ID from context",
    "answer": "Your daughter Sarah. She loves spending time with you!",
    "show_memories": true
}}

2. COUNT QUERY (e.g., "How many sons do I have?", "Do I have daughters?")
{{
    "type": "count",
    "count": 2,
    "family_members": ["id1", "id2"],
    "answer": "You have 2 sons: Mike and John. They both visit you often!",
    "show_memories": false
}}

3. LIST ALL (e.g., "Tell me about my family", "Who are my family members?")
{{
    "type": "list_all",
    "family_members": ["id1", "id2", "id3"],
    "answer": "You have a wonderful family! Your daughter Sarah, your son Mike, and your wife Maria. They all love you very much!",
    "show_memories": false
}}

4. PATIENT INFO (e.g., "Where is my home?", "Who is my doctor?")
{{
    "type": "patient_info",
    "info_type": "home|doctor|medication|emergency",
    "answer": "Your home is at [address]. It's a beautiful place with [description]!",
    "show_memories": false
}}

5. GENERAL CONVERSATION (e.g., "How are you?", "What's the weather?")
{{
    "type": "conversation",
    "answer": "I'm doing well! I'm here to help you remember your loved ones. Would you like to know about your family?",
    "show_memories": false
}}

6. UNCLEAR
{{
    "type": "unclear",
    "answer": "I'm not sure what you're asking. Could you ask about a specific family member or tell me what you'd like to know?",
    "show_memories": false
}}

IMPORTANT:
- Be warm, conversational, and positive
- Use the person's name when possible
- Add encouraging phrases
- Set show_memories=true ONLY when asking about a specific person's activities/memories

Return ONLY valid JSON, no extra text."""

        # Call Gemini
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean response (remove markdown code blocks if present)
        response_text = re.sub(r'```json\s*|\s*```', '', response_text).strip()
        
        # Parse JSON
        try:
            result = json.loads(response_text)
            result['error'] = None
            return result
        except json.JSONDecodeError:
            # Fallback: Try to extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                result['error'] = None
                return result
            else:
                return {
                    "type": "conversation",
                    "answer": "I had trouble understanding that. Could you rephrase your question?",
                    "show_memories": False,
                    "error": "Failed to parse Gemini response"
                }
        
    except Exception as e:
        print(f"Gemini query error: {e}")
        return {
            "type": "error",
            "answer": "Sorry, I'm having trouble right now. Please try again.",
            "show_memories": False,
            "error": str(e)
        }