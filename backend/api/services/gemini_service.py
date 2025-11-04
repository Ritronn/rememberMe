import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')   

def query_patient_memory(query: str, context: str):
    """Query Gemini with patient question and memory context"""
    try:
        prompt = f"""
Context: {context}

Patient Query: {query}

Based on the context above, identify which family member the patient is asking about and return their name and relationship. If unclear, return None.

Response format (JSON):
{{"name": "family member name", "relationship": "relationship to patient"}}
"""
        
        response = model.generate_content(prompt)
        return {"response": response.text, "error": None}
    except Exception as e:
        print(f"Gemini query error: {e}")
        return {"response": None, "error": str(e)}