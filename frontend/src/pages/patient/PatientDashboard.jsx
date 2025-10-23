// src/Pages/Patient/PatientDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Mic, Search, Loader2, User, Heart, LogOut, Volume2, Info, Home, Phone, MapPin, Pill, Calendar, Users, Clock, BookOpen, AlertCircle, X, Sparkles, ArrowLeft } from 'lucide-react';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [recentMemories, setRecentMemories] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const recognitionRef = useRef(null);

  // Check if patient is logged in with Supabase Auth
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
        setQuery(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        setError('Could not understand. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Listen for auth state changes
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
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (err) {
      console.error('Error fetching patient:', err);
      navigate('/patient/login');
    }
  };

  const fetchPatientInfo = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('patient_info')
        .select('*')
        .eq('patient_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      setPatientInfo(data);
    } catch (err) {
      console.error('Error fetching patient info:', err);
      setPatientInfo(null);
    }
  };

  const fetchFamilyMembers = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          *,
          memories:memories(id)
        `)
        .eq('patient_id', userId);

      if (error) throw error;
      
      // Transform data to include memory count
      const membersWithCount = (data || []).map(member => ({
        ...member,
        memoryCount: member.memories?.length || 0
      }));
      
      setFamilyMembers(membersWithCount);
    } catch (err) {
      console.error('Error fetching family members:', err);
      setFamilyMembers([]);
    }
  };

  const fetchRecentMemories = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select(`
          *,
          family_members!inner (
            id,
            name,
            relationship,
            profile_photo_url,
            patient_id
          )
        `)
        .eq('family_members.patient_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentMemories(data || []);
    } catch (err) {
      console.error('Error fetching recent memories:', err);
    }
  };

  // View family member details
  const viewMemberDetails = async (member) => {
    try {
      const { data: memberWithMemories, error } = await supabase
        .from('family_members')
        .select(`
          *,
          memories (*)
        `)
        .eq('id', member.id)
        .single();

      if (error) throw error;

      setResults({
        type: 'family_member',
        member: memberWithMemories,
        memories: memberWithMemories.memories || []
      });
      setSelectedMember(memberWithMemories);
    } catch (err) {
      console.error('Error fetching member details:', err);
      setError('Could not load family member details');
    }
  };

  // Start voice recognition
  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      setError('');
      recognitionRef.current.start();
    } else {
      setError('Voice recognition not supported in this browser');
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Handle search/query
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter or speak a question');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const queryLower = query.toLowerCase();
      let matchedMember = null;

      // Check for relationship keywords
      const relationshipKeywords = {
        daughter: ['daughter'],
        son: ['son'],
        wife: ['wife', 'spouse'],
        husband: ['husband', 'spouse'],
        granddaughter: ['granddaughter', 'grandchild'],
        grandson: ['grandson', 'grandchild'],
        mother: ['mother', 'mom', 'mum'],
        father: ['father', 'dad'],
        sister: ['sister'],
        brother: ['brother'],
      };

      for (const [relation, keywords] of Object.entries(relationshipKeywords)) {
        if (keywords.some(kw => queryLower.includes(kw))) {
          matchedMember = familyMembers.find(m => 
            m.relationship.toLowerCase() === relation
          );
          break;
        }
      }

      // Check for name mentions
      if (!matchedMember) {
        matchedMember = familyMembers.find(m => 
          queryLower.includes(m.name.toLowerCase())
        );
      }

      if (matchedMember) {
        await viewMemberDetails(matchedMember);
      } else {
        setError('I couldn\'t find anyone matching your question. Try asking about your daughter, son, or other family members.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick queries
  const quickQueries = [
    "Who is my daughter?",
    "Who is my son?",
    "What did we do last weekend?",
    "Tell me about my family"
  ];

  const handleQuickQuery = (queryText) => {
    setQuery(queryText);
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/patient/login');
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-animation opacity-50"></div>
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin relative z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-animation opacity-50"></div>
      
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b-2 border-white/20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  RememberMe
                </h1>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Heart className="w-8 h-8 text-red-500" />
                  Hello, {patient.name}!
                </h1>
                <p className="text-xl text-gray-600 mt-2">Ask me about your family and memories</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 px-6 py-3 text-lg text-gray-700 hover:bg-white/50 rounded-xl transition-all duration-300 backdrop-blur-sm border-2 border-white/30 hover:border-purple-200 hover:shadow-lg"
              >
                <Info className="w-6 h-6" />
                My Info
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 text-lg text-gray-700 hover:bg-white/50 rounded-xl transition-all duration-300 backdrop-blur-sm border-2 border-white/30 hover:border-red-200 hover:shadow-lg"
              >
                <LogOut className="w-6 h-6" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Search & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Box */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border-2 border-white/20">
              <form onSubmit={handleSearch} className="space-y-6">
                <div>
                  <label className="block text-2xl font-semibold text-gray-700 mb-4">
                    What would you like to know?
                  </label>
                  <div className="relative group">
                    <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-8 h-8 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder='Ask about your family...'
                      className="w-full pl-20 pr-6 py-6 text-2xl border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50/50 focus:bg-white"
                      disabled={loading || isListening}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={loading}
                    className={`flex-1 flex items-center justify-center gap-3 px-8 py-6 text-2xl rounded-2xl font-bold transition-all duration-300 shadow-lg transform hover:scale-105 ${
                      isListening
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse shadow-xl'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                    }`}
                  >
                    <Mic className="w-8 h-8" />
                    {isListening ? 'Listening...' : 'Speak'}
                  </button>

                  <button
                    type="submit"
                    disabled={loading || isListening}
                    className="flex-1 flex items-center justify-center gap-3 px-8 py-6 text-2xl bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-2xl hover:from-green-600 hover:to-teal-700 transition-all duration-300 font-bold shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-8 h-8 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-8 h-8" />
                        Search
                      </>
                    )}
                  </button>
                </div>
              </form>

              {error && (
                <div className="mt-6 p-6 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-4 animate-shake">
                  <AlertCircle className="w-7 h-7 text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-xl">{error}</p>
                </div>
              )}

              {/* Quick Queries */}
              <div className="mt-6">
                <p className="text-lg font-semibold text-gray-700 mb-3">Quick Questions:</p>
                <div className="grid grid-cols-2 gap-3">
                  {quickQueries.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickQuery(q)}
                      className="px-4 py-3 text-lg bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-all duration-300 border-2 border-blue-200/50 hover:border-blue-300 text-left transform hover:scale-105"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Memories */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border-2 border-white/20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-600" />
                Recent Memories
              </h2>
              {recentMemories.length > 0 ? (
                <div className="space-y-4">
                  {recentMemories.map((memory) => (
                    <div
                      key={memory.id}
                      className="p-5 bg-gradient-to-r from-blue-50/80 to-green-50/80 rounded-xl hover:shadow-lg transition-all duration-300 border-2 border-blue-100/50 backdrop-blur-sm transform hover:scale-[1.02]"
                    >
                      <div className="flex items-start gap-4">
                        {memory.family_members.profile_photo_url ? (
                          <img
                            src={memory.family_members.profile_photo_url}
                            alt={memory.family_members.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center border-2 border-white shadow-md">
                            <User className="w-7 h-7 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-900">{memory.title}</h4>
                          <p className="text-gray-600 text-sm mb-1">
                            with {memory.family_members.name} ({memory.family_members.relationship})
                          </p>
                          <p className="text-gray-700 line-clamp-2">{memory.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-xl text-gray-500">No memories yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Family Members & Info */}
          <div className="space-y-6">
            {/* Family Members */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border-2 border-white/20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                Your Family
              </h2>
              {familyMembers.length > 0 ? (
                <div className="space-y-4">
                  {familyMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => viewMemberDetails(member)}
                      className="p-4 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-purple-100/50 backdrop-blur-sm transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-4">
                        {member.profile_photo_url ? (
                          <img
                            src={member.profile_photo_url}
                            alt={member.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center border-2 border-white shadow-md">
                            <User className="w-8 h-8 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                          <p className="text-gray-600">{member.relationship}</p>
                          <p className="text-sm text-purple-600 font-semibold mt-1">
                            {member.memoryCount || 0} memories
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-xl text-gray-500">No family members added yet</p>
                </div>
              )}
            </div>

            {/* Quick Info Card */}
            {patientInfo && (
              <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl p-8 text-white border-2 border-white/20">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Info className="w-7 h-7" />
                  Quick Info
                </h3>
                <div className="space-y-3">
                  {patientInfo.home_address && (
                    <div className="flex items-start gap-3">
                      <Home className="w-6 h-6 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold">Home</p>
                        <p className="text-blue-100 text-sm">{patientInfo.home_address}</p>
                      </div>
                    </div>
                  )}
                  {patientInfo.doctor_name && (
                    <div className="flex items-start gap-3">
                      <User className="w-6 h-6 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold">Doctor</p>
                        <p className="text-blue-100 text-sm">{patientInfo.doctor_name}</p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setShowProfile(true)}
                    className="w-full mt-4 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 font-bold border-2 border-white/30 transform hover:scale-105"
                  >
                    View All Info
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {results && results.type === 'family_member' && (
          <div className="mt-8 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border-2 border-white/20 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Search Results</h2>
              <button
                onClick={() => setResults(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="flex items-start gap-6 mb-8">
              {results.member.profile_photo_url ? (
                <img
                  src={results.member.profile_photo_url}
                  alt={results.member.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-green-500 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center border-4 border-green-600 shadow-lg">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-4xl font-bold text-gray-900 mb-2">{results.member.name}</h3>
                <p className="text-2xl text-gray-600 mb-4">Your {results.member.relationship}</p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-100 to-blue-100 text-green-700 rounded-full text-xl font-semibold border-2 border-green-200">
                  <Heart className="w-6 h-6" />
                  {results.memories.length} {results.memories.length === 1 ? 'Memory' : 'Memories'}
                </div>
              </div>
            </div>

            {results.memories.length > 0 ? (
              <div className="space-y-6">
                <h4 className="text-2xl font-bold text-gray-900">Memories Together</h4>
                <div className="grid gap-6">
                  {results.memories.map((memory) => (
                    <div
                      key={memory.id}
                      className="bg-gradient-to-r from-green-50/80 to-blue-50/80 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-2 border-green-100/50 backdrop-blur-sm transform hover:scale-[1.01]"
                    >
                      <h5 className="text-2xl font-bold text-gray-900 mb-3">{memory.title}</h5>
                      <p className="text-xl text-gray-700 mb-4">{memory.content}</p>
                      {memory.audio_url && (
                        <div className="flex items-center gap-3 text-green-600">
                          <Volume2 className="w-6 h-6" />
                          <span className="text-lg font-semibold">Audio available</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/80 rounded-2xl p-8 text-center border-2 border-gray-200/50">
                <p className="text-2xl text-gray-600">
                  No memories yet with {results.member.name}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Profile Modal */}
      {showProfile && patientInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowProfile(false)}>
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 border-2 border-white/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">My Information</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="grid gap-6">
              {patientInfo.home_address && (
                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-xl border-2 border-blue-100/50 backdrop-blur-sm">
                  <MapPin className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Home Address</h3>
                    <p className="text-lg text-gray-700">{patientInfo.home_address}</p>
                  </div>
                </div>
              )}

              {patientInfo.home_photo_url && (
                <div className="p-4 bg-gradient-to-r from-green-50/80 to-blue-50/80 rounded-xl border-2 border-green-100/50 backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Home className="w-8 h-8 text-green-600" />
                    My Home
                  </h3>
                  <img 
                    src={patientInfo.home_photo_url} 
                    alt="Home" 
                    className="w-full max-w-md rounded-lg shadow-lg border-2 border-white"
                  />
                </div>
              )}

              {patientInfo.emergency_contacts && patientInfo.emergency_contacts.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-red-50/80 to-orange-50/80 rounded-xl border-2 border-red-100/50 backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Phone className="w-8 h-8 text-red-600" />
                    Emergency Contacts
                  </h3>
                  <div className="space-y-3">
                    {patientInfo.emergency_contacts.map((contact, idx) => (
                      <div key={idx} className="bg-white/80 p-4 rounded-lg border-2 border-white backdrop-blur-sm">
                        <p className="text-lg font-semibold text-gray-900">{contact.name}</p>
                        <p className="text-gray-600">{contact.relationship}</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">{contact.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(patientInfo.doctor_name || patientInfo.doctor_phone) && (
                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-xl border-2 border-purple-100/50 backdrop-blur-sm">
                  <User className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">My Doctor</h3>
                    {patientInfo.doctor_name && (
                      <p className="text-lg text-gray-700">{patientInfo.doctor_name}</p>
                    )}
                    {patientInfo.doctor_phone && (
                      <p className="text-lg font-bold text-gray-900">{patientInfo.doctor_phone}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .bg-gradient-animation {
          background: linear-gradient(
            45deg,
            rgba(59, 130, 246, 0.1),
            rgba(147, 51, 234, 0.1),
            rgba(236, 72, 153, 0.1),
            rgba(59, 130, 246, 0.1)
          );
          background-size: 400% 400%;
          animation: gradient-shift 15s ease infinite;
        }

        .particle {
          position: absolute;
          background: radial-gradient(circle, rgba(147, 51, 234, 0.3), transparent);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }

        .particle-1 {
          width: 80px;
          height: 80px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .particle-2 {
          width: 60px;
          height: 60px;
          top: 60%;
          left: 80%;
          animation-delay: 2s;
          animation-duration: 8s;
        }

        .particle-3 {
          width: 100px;
          height: 100px;
          top: 80%;
          left: 20%;
          animation-delay: 1s;
          animation-duration: 7s;
        }

        .particle-4 {
          width: 70px;
          height: 70px;
          top: 30%;
          left: 70%;
          animation-delay: 3s;
          animation-duration: 9s;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default PatientDashboard;