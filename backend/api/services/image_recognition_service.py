# backend/api/services/image_recognition_service.py

import google.generativeai as genai
from PIL import Image
import io
import requests
import json
import re

def identify_person_from_photo(uploaded_image_bytes, family_members):
    """
    Use Gemini Vision to identify person in photo by comparing with family member photos
    
    Args:
        uploaded_image_bytes: Bytes of uploaded image
        family_members: List of dicts with id, name, relationship, profile_photo_url
    
    Returns:
        {
            "match": "found" | "unknown",
            "family_member_id": "uuid or null",
            "name": "...",
            "relationship": "...",
            "confidence": "high" | "medium" | "low" | "none",
            "error": None
        }
    """
    try:
        # Initialize Gemini Vision model
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Load uploaded image
        uploaded_image = Image.open(io.BytesIO(uploaded_image_bytes))
        
        # Build context with family members
        context_parts = ["The patient uploaded this photo.\n\n"]
        context_parts.append("Compare this person to these family members:\n\n")
        
        # Prepare content list for Gemini (images + text)
        content = [uploaded_image]  # Start with uploaded image
        
        # Download and add reference photos
        member_mapping = {}
        for i, member in enumerate(family_members):
            if not member.get('profile_photo_url'):
                continue
            
            ref_num = i + 1
            member_mapping[ref_num] = member
            
            context_parts.append(
                f"{ref_num}. {member['name']} ({member['relationship']}) - "
                f"See reference photo {ref_num} below\n"
            )
            
            # Download reference photo
            try:
                response = requests.get(member['profile_photo_url'], timeout=10)
                if response.status_code == 200:
                    ref_image = Image.open(io.BytesIO(response.content))
                    content.append(ref_image)
            except Exception as e:
                print(f"Failed to download photo for {member['name']}: {e}")
                continue
        
        if len(content) == 1:  # Only uploaded image, no reference photos
            return {
                "match": "unknown",
                "family_member_id": None,
                "name": None,
                "relationship": None,
                "confidence": "none",
                "error": "No family member photos available for comparison"
            }
        
        # Build complete prompt
        prompt = "".join(context_parts)
        prompt += """
\nINSTRUCTIONS:
1. Look at the FIRST image (the uploaded photo)
2. Compare the person's face with the reference photos that follow
3. Consider: facial features, age, gender, hair color/style, overall appearance
4. Identify the BEST MATCH from the family members listed above
5. If the person doesn't clearly match anyone, return "unknown"

IMPORTANT:
- Only return "found" if you're reasonably confident
- Consider that photos may be from different times/angles/lighting
- The person should look like the SAME individual, not just similar

Return ONLY valid JSON:
{
    "match": "found" or "unknown",
    "matched_number": 1-N (the number from the list above, if match found),
    "confidence": "high" or "medium" or "low" or "none",
    "reasoning": "brief explanation of why you matched or didn't match"
}

Return ONLY the JSON, no extra text."""

        # Add prompt to content
        content.append(prompt)
        
        # Call Gemini Vision
        response = model.generate_content(content)
        response_text = response.text.strip()
        
        # Clean response
        response_text = re.sub(r'```json\s*|\s*```', '', response_text).strip()
        
        # Parse JSON
        try:
            result = json.loads(response_text)
            
            if result.get('match') == 'found' and result.get('matched_number'):
                matched_member = member_mapping.get(result['matched_number'])
                if matched_member:
                    return {
                        "match": "found",
                        "family_member_id": matched_member['id'],
                        "name": matched_member['name'],
                        "relationship": matched_member['relationship'],
                        "confidence": result.get('confidence', 'medium'),
                        "reasoning": result.get('reasoning', ''),
                        "error": None
                    }
            
            # No match or low confidence
            return {
                "match": "unknown",
                "family_member_id": None,
                "name": None,
                "relationship": None,
                "confidence": result.get('confidence', 'none'),
                "reasoning": result.get('reasoning', 'Could not identify this person'),
                "error": None
            }
            
        except json.JSONDecodeError:
            # Fallback: Try to extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                # Process result same as above
                if result.get('match') == 'found' and result.get('matched_number'):
                    matched_member = member_mapping.get(result['matched_number'])
                    if matched_member:
                        return {
                            "match": "found",
                            "family_member_id": matched_member['id'],
                            "name": matched_member['name'],
                            "relationship": matched_member['relationship'],
                            "confidence": result.get('confidence', 'medium'),
                            "reasoning": result.get('reasoning', ''),
                            "error": None
                        }
                
                return {
                    "match": "unknown",
                    "family_member_id": None,
                    "name": None,
                    "relationship": None,
                    "confidence": "none",
                    "reasoning": "Could not identify",
                    "error": None
                }
            else:
                return {
                    "match": "unknown",
                    "family_member_id": None,
                    "name": None,
                    "relationship": None,
                    "confidence": "none",
                    "reasoning": "Failed to parse response",
                    "error": "Could not parse Gemini response"
                }
        
    except Exception as e:
        print(f"Image recognition error: {e}")
        return {
            "match": "error",
            "family_member_id": None,
            "name": None,
            "relationship": None,
            "confidence": "none",
            "reasoning": str(e),
            "error": str(e)
        }