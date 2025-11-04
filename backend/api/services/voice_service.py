from TTS.api import TTS
import os
import requests
import tempfile

# Initialize model
print("Loading Coqui TTS model...")
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
print("Model loaded successfully!")

def generate_audio_from_text(text: str, voice_sample_url: str):
    """Generate TTS audio using voice cloning"""
    temp_voice_path = None
    temp_output_path = None
    
    try:
        # Download voice sample
        response = requests.get(voice_sample_url)
        if response.status_code != 200:
            raise Exception(f"Failed to download voice sample: {response.status_code}")
        
        # Use temp directory for better cleanup
        temp_voice_path = os.path.join(tempfile.gettempdir(), "temp_voice_sample.wav")
        temp_output_path = os.path.join(tempfile.gettempdir(), "temp_output.wav")
        
        with open(temp_voice_path, "wb") as f:
            f.write(response.content)
        
        # Generate audio
        tts.tts_to_file(
            text=text,
            speaker_wav=temp_voice_path,
            language="en",
            file_path=temp_output_path
        )
        
        # Read generated audio
        with open(temp_output_path, "rb") as f:
            audio_bytes = f.read()
        
        return {"audio": audio_bytes, "error": None}
        
    except Exception as e:
        print(f"TTS generation error: {e}")
        return {"audio": None, "error": str(e)}
    
    finally:
        # Cleanup temp files
        if temp_voice_path and os.path.exists(temp_voice_path):
            os.remove(temp_voice_path)
        if temp_output_path and os.path.exists(temp_output_path):
            os.remove(temp_output_path)