# RememberMe 🧠💜

> An AI-powered memory companion helping Alzheimer's patients reconnect with their loved ones through voice-cloned memories and intelligent face recognition.

## Description

RememberMe bridges the memory gap for Alzheimer's patients by combining AI voice cloning, facial recognition, and natural language processing. Family members create personalized audio-visual memories, while patients can ask natural questions like "Who is my daughter?" and receive compassionate, AI-powered responses in their family's actual voice.

## Features

- 🎙️ **Zero-Shot Voice Cloning**: Converts text memories to audio in family member's voice using Coqui TTS
- 👤 **Dual Face Recognition**: Real-time camera identification + photo upload matching via Gemini Vision
- 🗣️ **Natural Language Queries**: Ask questions in plain English - "Who is my daughter?" or "What did I do with Sarah?"
- 🌐 **Multilingual Memory Display**: Memories shown in English, Hindi, and Marathi text
- 📹 **Video Memory Feed**: Upload and share family video moments with thumbnails
- 📸 **Photo Albums**: Attach up to 5 photos per memory with automatic gallery view
- 🔊 **Audio Playback**: Listen to memories in cloned family voices
- 👥 **Dual Portal System**: Separate interfaces for family members and patients

## Architecture

### How It Works

**Family Portal Workflow:**
1. Family member registers with name, email, relationship to patient
2. Uploads 30-second voice sample → Stored in Supabase Storage
3. Creates text memory with optional photos (max 5)
4. Backend calls Coqui TTS with voice sample → Generates voice-cloned audio
5. Audio uploaded to storage → URL saved to database
6. Memory ready with text, photos, and audio in family's voice

**Patient Portal Workflow:**
1. Patient logs in with simple UI (large buttons, clear text)
2. **Option A - Text/Voice Query:**
   - Types or speaks: "Who is my daughter?"
   - Django backend receives query + fetches all family members
   - Gemini API analyzes query → Returns structured JSON with family member ID
   - Backend fetches that member's profile + all memories
   - Frontend displays profile card + memory grid with audio player
3. **Option B - Face Recognition (Photo Upload):**
   - Patient uploads photo asking "Who is this?"
   - Gemini Vision compares with all family member profile photos
   - Returns match with confidence level + all memories
4. **Option C - Face Recognition (Real-time Camera):**
   - Patient clicks camera button → Webcam opens
   - Captures frame → Sends to Gemini Vision
   - Identifies person in real-time → Shows profile + memories
5. **Memory Playback:**
   - Patient clicks memory card
   - Views photos in gallery
   - Plays audio in family member's cloned voice
   - Text displayed in selected language (English/Hindi/Marathi)

**Data Flow:**
```
Frontend (React) → Django REST API → Supabase (PostgreSQL + Storage)
                         ↓
                   AI Services:
                   - Gemini 2.5 Flash (NLP)
                   - Gemini Vision (Face Recognition)
                   - Coqui TTS XTTS-v2 (Voice Cloning)
```

## Key Innovations

1. **Zero-Shot Voice Cloning**: No pre-training needed - generates voice-cloned audio from single 30-second sample using Coqui XTTS-v2
2. **Structured NLP Responses**: Gemini returns JSON with database IDs for precise data retrieval, not just text answers
3. **Dual Face Recognition**: Both upload and real-time camera options using Gemini Vision's multi-image comparison
4. **Multilingual Memory Translation**: Memories stored in English, displayed in Hindi/Marathi on-demand
5. **Context-Aware Queries**: Handles diverse questions - "Who is my daughter?", "How many children?", "Where is my house?"
6. **Compassionate AI Responses**: Warm, encouraging language designed for cognitive impairment

## Social Impact

**For Patients:**
- Reduces anxiety and confusion about family members
- Maintains emotional connections despite memory loss
- Provides independence in recalling information
- Preserves dignity through self-service memory access
- Multilingual support for diverse communities

**For Families:**
- Reduces caregiver burden of repetitive questions
- Creates lasting voice legacy of loved ones
- Enables remote connection through video memories
- Provides peace of mind when physically distant
- Easy memory preservation for future generations

**For Society:**
- Addresses growing Alzheimer's crisis (55M+ worldwide)
- Affordable alternative to 24/7 care assistance
- Culturally inclusive with multilingual support
- Scalable solution for underserved communities
- Promotes aging with dignity and independence

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- Supabase account
- Google Gemini API key

### Backend Setup

1. **Install dependencies:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install django djangorestframework supabase python-dotenv google-generativeai TTS pillow requests django-cors-headers
```

2. **Create `.env` file:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

3. **Run server:**
```bash
python manage.py runserver
```

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Create `.env` file:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE=http://localhost:8000/api
```

3. **Run development server:**
```bash
npm start
```


### Access the App

- **Family Portal**: http://localhost:5173/login
- **Patient Portal**: http://localhost:5173/patient/login
- **Backend API**: http://localhost:8000/api

---

**Made with ❤️ for Alzheimer's patients and their families**

*"Helping remember what matters most"*
