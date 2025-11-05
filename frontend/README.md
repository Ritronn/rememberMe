# RememberMe - Alzheimer's Care App

A web application helping Alzheimer's patients recognize family members and recall memories using AI voice cloning and NLP.

## 🎯 Features

### Family Portal
- Register with profile and voice sample
- Voice cloning using Coqui XTTS-v2
- Create memories with photos
- Auto-generate audio in cloned voice

### Patient Portal
- Ask questions via text or voice
- View family member profiles
- Listen to memories in cloned voices
- Get info about home, appointments, medications

---

## 🛠️ Tech Stack

**Frontend**: React + Vite + Tailwind CSS + React Router  
**Backend**: Django + Django REST Framework  
**Database**: Supabase PostgreSQL  
**Storage**: Supabase Storage  
**Voice Cloning**: Coqui XTTS-v2 (local GPU)  
**NLP**: Google Gemini API 1.5 Flash  

---

## 🚀 Setup Instructions

### 1. Database Setup (Supabase)

Create a Supabase project and set up tables for: `patients`, `family_members`, `memories`, `memory_photos`, `patient_info`

Create storage buckets: `profiles`, `voice-samples`, `memory-audio`, `memory-photos` (all public)

Get your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from project settings.

---

### 2. Backend Setup (Django)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install django djangorestframework django-cors-headers supabase python-dotenv google-generativeai TTS requests

# Create .env file
cat > .env << EOF
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
EOF

# Run server
python manage.py runserver
```

Backend runs at: `http://127.0.0.1:8000`

---

### 3. Voice Cloning Setup (Local GPU Server)

```bash
# Install Coqui TTS
pip install TTS

# The voice_service.py uses Coqui XTTS-v2 model
# Model auto-downloads on first use (~2GB)
# Requires: GPU with 6GB+ VRAM (RTX 2060 or better)
```

---

### 4. Frontend Setup (React)

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=http://127.0.0.1:8000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
EOF

# Run development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 📋 API Endpoints

### Family Member Registration
- `POST /api/register/` - Register family member (returns `family_member_id`)
- `POST /api/upload-voice/` - Upload voice sample for cloning

### Memory Management
- `POST /api/create-memory/` - Create memory with photos + generate audio
- `GET /api/memories/{family_member_id}/` - Get all memories

### Patient Queries
- `POST /api/query/` - Ask question (Gemini identifies family member)
- `GET /api/family-members/{patient_id}/` - Get all family members

---

## 🔑 Environment Variables

### Backend (.env)
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (.env)
```
VITE_API_URL=http://127.0.0.1:8000/api
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📊 Data Flow

### Voice Cloning Flow
1. Family member records 30s audio → Frontend
2. Upload to Django `/upload-voice/` → Saves to Supabase Storage
3. Download audio → Send to Coqui XTTS-v2
4. Generate voice embeddings → Store URL in database
5. Status updated to 'ready'

### Memory Creation Flow
1. Family member creates memory with text + photos
2. Django uploads photos to Supabase Storage
3. Retrieves voice sample URL from database
4. Sends text + voice URL to Coqui XTTS-v2
5. Generates audio in cloned voice
6. Uploads audio to Supabase Storage
7. Saves audio URL in memories table

### Patient Query Flow
1. Patient asks: "Who is my daughter?"
2. Django retrieves all family members for context
3. Sends query + context to Gemini API
4. Gemini identifies family member
5. Returns family member profile + memories
6. Frontend displays profile and memory cards
7. Patient selects memory → plays audio

---

## 🎨 Key Components

**FamilyRegister.jsx** - 2-step registration (info + voice)  
**Dashboard.jsx** - Family member dashboard  
**MemoryManager.jsx** - Create/manage memories  
**PatientQuery.jsx** - Patient interface with voice/text input  

---

## 🚀 Deployment

### Frontend (Netlify)
- Connect GitHub repo
- Build command: `npm run build`
- Publish directory: `dist`
- Add environment variables

### Backend (Render)
- Create Web Service
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn backend.wsgi:application`
- Add environment variables

---

## 📝 Test Data

Patient ID: `0c02b145-5b4d-456a-bfe3-50d442adf57f`

Use this ID when registering family members or testing patient queries.

---

## 🔒 Security Notes

- Service role key used in backend only (never expose in frontend)
- CORS configured for frontend domain
- File uploads validated and sanitized
- Voice samples and memories isolated per patient

---


## Credits

- Voice Cloning: Coqui TTS XTTS-v2
- NLP: Google Gemini 1.5 Flash
- Database: Supabase
- UI: Tailwind CSS
