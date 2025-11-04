from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Changed to service role

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError('Missing Supabase environment variables')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_file(bucket: str, path: str, file):
    """Upload file to Supabase Storage"""
    try:
        # Upload file
        res = supabase.storage.from_(bucket).upload(
            path, 
            file,
            file_options={"cache-control": "3600", "upsert": "true"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(bucket).get_public_url(path)
        
        return {"url": public_url, "error": None}
    except Exception as e:
        print(f"Upload error: {e}")
        return {"url": None, "error": str(e)}

def delete_file(bucket: str, path: str):
    """Delete file from Supabase Storage"""
    try:
        supabase.storage.from_(bucket).remove([path])
        return {"error": None}
    except Exception as e:
        print(f"Delete error: {e}")
        return {"error": str(e)}