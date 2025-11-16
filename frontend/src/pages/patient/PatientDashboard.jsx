// src/Pages/Patient/PatientDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Mic, Send, Loader2, User, Heart, LogOut, Volume2, Info, Home, Users, Clock, AlertCircle, X, Sparkles, ChevronDown, ChevronUp, Camera, Image as ImageIcon } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [recentMemories, setRecentMemories] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if patient is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        navigate('/patient/login');
        return;
      }
      
      await fetchPatient(user.id);
      await fetchPatientInfo(user.id);
      await fetchFamilyMembers(user.id);
      await fetchRecentMemories(user.id);
    };
    
    checkAuth();
    
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/patient/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchPatient = async (userId) => {
    try {
      const { data, error } = await supabase.from('patients').select('*').eq('id', userId).single();
      if (error) throw error;
      setPatient(data);
    } catch (err) {
      console.error('Error fetching patient:', err);
      navigate('/patient/login');
    }
  };

  const fetchPatientInfo = async (userId) => {
    try {
      const { data, error } = await supabase.from('patient_info').select('*').eq('patient_id', userId).single();
      if (error && error.code !== 'PGRST116') throw error;
      setPatientInfo(data);
    } catch (err) {
      console.error('Error fetching patient info:', err);
    }
  };

  const fetchFamilyMembers = async (userId) => {
    try {
      const { data, error } = await supabase.from('family_members').select(`*, memories:memories(id)`).eq('patient_id', userId);
      if (error) throw error;
      const membersWithCount = (data || []).map(member => ({
        ...member,
        memoryCount: member.memories?.length || 0
      }));
      setFamilyMembers(membersWithCount);
    } catch (err) {
      console.error('Error fetching family members:', err);
    }
  };

  const fetchRecentMemories = async (userId) => {
    try {
      const { data, error } = await supabase.from('memories').select(`
          *,
          family_members!inner (id, name, relationship, profile_photo_url, patient_id)
        `).eq('family_members.patient_id', userId).order('created_at', { ascending: false }).limit(3);
      if (error) throw error;
      setRecentMemories(data || []);
    } catch (err) {
      console.error('Error fetching recent memories:', err);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Handle message send
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/query/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          query: userMessage
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Query failed');
      }

      // Add AI response to chat
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        responseType: data.type,
        content: data.answer,
        data: data, // Store full response
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        responseType: 'error',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || loading) return;

    // Add user message showing image upload
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: '📷 Uploaded a photo',
      isImage: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('patient_id', patient.id);

      const response = await fetch(`${API_BASE}/identify-photo/`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Image recognition failed');
      }

      // Add AI response
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        responseType: data.match === 'found' ? 'family_member' : 'conversation',
        content: data.answer,
        data: data,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      console.error('Image recognition error:', err);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        responseType: 'error',
        content: 'Sorry, I had trouble recognizing that photo. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/patient/login');
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                RememberMe
              </h1>
              <span className="text-lg text-gray-700">Hello, {patient.name}!</span>
            </div>
            <div className="flex items-center gap-2">
              {patientInfo && (
                <button
                  onClick={() => setShowProfile(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-white/50 rounded-lg transition-all"
                >
                  <Info className="w-4 h-4" />
                  My Info
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-white/50 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid lg:grid-cols-4 gap-4">
          {/* Chat Column - 3/4 width */}
          <div className="lg:col-span-3">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Heart className="w-16 h-16 text-purple-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Ask me anything!</h3>
                    <p className="text-gray-600 text-sm max-w-md mb-3">
                      Try: "Who is my daughter?", "How many sons do I have?", "Tell me about my family"
                    </p>
                    <div className="flex items-center gap-2 text-purple-600 text-sm font-semibold">
                      <Camera className="w-5 h-5" />
                      <span>Or upload a photo to identify someone!</span>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))
                )}
                {loading && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={loading}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                    }`}
                    title="Speak"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 font-semibold transition-all disabled:opacity-50"
                    title="Upload Photo"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about your family or upload a photo..."
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    disabled={loading || isListening}
                  />
                  <button
                    type="submit"
                    disabled={loading || !inputMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl hover:from-green-600 hover:to-teal-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  💬 Type a message • 🎤 Speak • 📷 Upload a photo to identify family
                </p>
              </form>
            </div>
          </div>

          {/* Right Sidebar - 1/4 width */}
          <div className="space-y-4">
            {/* Family Members */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-4 border border-white/20">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Your Family
              </h3>
              {familyMembers.length > 0 ? (
                <div className="space-y-2">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                      <div className="flex items-center gap-2">
                        {member.profile_photo_url ? (
                          <img src={member.profile_photo_url} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-white" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{member.name}</h4>
                          <p className="text-xs text-gray-600">{member.relationship}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No family members yet</p>
              )}
            </div>

            {/* Recent Memories */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-4 border border-white/20">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Recent Memories
              </h3>
              {recentMemories.length > 0 ? (
                <div className="space-y-2">
                  {recentMemories.map((memory) => (
                    <div key={memory.id} className="p-2 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{memory.title}</h4>
                      <p className="text-xs text-gray-600">with {memory.family_members.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No memories yet</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      {showProfile && patientInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowProfile(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">My Information</h2>
              <button onClick={() => setShowProfile(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              {patientInfo.home_address && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900">Home</p>
                  <p className="text-sm text-gray-700">{patientInfo.home_address}</p>
                </div>
              )}
              {patientInfo.doctor_name && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900">Doctor</p>
                  <p className="text-sm text-gray-700">{patientInfo.doctor_name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message }) => {
  const [showMemories, setShowMemories] = useState(false);

  if (message.type === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-md">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  // AI message
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-tl-sm max-w-2xl">
        <p className="text-sm text-gray-900 mb-2">{message.content}</p>
        
        {/* Family Member Card */}
        {message.responseType === 'family_member' && message.data?.family_member && (
          <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              {message.data.family_member.profile_photo_url ? (
                <img src={message.data.family_member.profile_photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">{message.data.family_member.name}</h4>
                <p className="text-sm text-gray-600">{message.data.family_member.relationship}</p>
              </div>
            </div>
            
            {message.data.show_memories && message.data.memories && message.data.memories.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowMemories(!showMemories)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  {showMemories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showMemories ? 'Hide' : 'Show'} {message.data.memories.length} Memories
                </button>
                
                {showMemories && (
                  <div className="mt-2 space-y-2">
                    {message.data.memories.map((memory) => (
                      <MemoryCard key={memory.id} memory={memory} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Count/List All */}
        {(message.responseType === 'count' || message.responseType === 'list_all') && message.data?.family_members && (
          <div className="mt-2 space-y-1">
            {message.data.family_members.map((member) => (
              <div key={member.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                {member.profile_photo_url ? (
                  <img src={member.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-600">{member.relationship}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Memory Card Component
const MemoryCard = ({ memory }) => {
  return (
    <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
      <h5 className="text-sm font-bold text-gray-900 mb-1">{memory.title}</h5>
      <p className="text-xs text-gray-700 mb-2 line-clamp-2">{memory.content}</p>
      
      {memory.photos && memory.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-1 mb-2">
          {memory.photos.slice(0, 3).map((photo, idx) => (
            <img key={idx} src={photo.photo_url} alt="" className="w-full h-16 object-cover rounded" />
          ))}
        </div>
      )}
      
      {memory.audio_url && (
        <audio controls className="w-full h-8">
          <source src={memory.audio_url} type="audio/wav" />
        </audio>
      )}
    </div>
  );
};

export default PatientDashboard;