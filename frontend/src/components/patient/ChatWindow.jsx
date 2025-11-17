// src/components/patient/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Loader2, Heart, Camera, User, ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

const ChatWindow = ({ patientId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech recognition
  useEffect(() => {
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

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);
    
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/query/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, query: userMessage })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Query failed');

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        responseType: data.type,
        content: data.answer,
        data: data,
        timestamp: new Date()
      }]);

    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        responseType: 'error',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || loading) return;

    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      content: '📷 Uploaded a photo',
      isImage: true,
      timestamp: new Date()
    }]);
    
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('patient_id', patientId);

      const response = await fetch(`${API_BASE}/identify-photo/`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Image recognition failed');

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        responseType: data.match === 'found' ? 'family_member' : 'conversation',
        content: data.answer,
        data: data,
        timestamp: new Date()
      }]);

    } catch (err) {
      console.error('Image recognition error:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        responseType: 'error',
        content: 'Sorry, I had trouble recognizing that photo. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Messages */}
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
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={loading}
            className={`px-4 py-3 rounded-xl font-semibold transition-all ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 font-semibold transition-all disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
          </button>
          
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          
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
  );
};

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

  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-tl-sm max-w-2xl">
        <p className="text-sm text-gray-900 mb-2">{message.content}</p>
        
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
            
            {message.data.show_memories && message.data.memories?.length > 0 && (
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

const MemoryCard = ({ memory }) => {
  return (
    <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
      <h5 className="text-sm font-bold text-gray-900 mb-1">{memory.title}</h5>
      <p className="text-xs text-gray-700 mb-2 line-clamp-2">{memory.content}</p>
      
      {memory.photos?.length > 0 && (
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

export default ChatWindow;