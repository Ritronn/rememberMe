// src/Pages/Patient/PatientDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ChatWindow from '../../components/patient/ChatWindow';
import { Loader2, User, LogOut, Info, Home, Users, Clock, X, Sparkles, Video } from 'lucide-react';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [recentMemories, setRecentMemories] = useState([]);
  const [showProfile, setShowProfile] = useState(false);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') navigate('/patient/login');
    });

    return () => subscription.unsubscribe();
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
      setFamilyMembers((data || []).map(m => ({ ...m, memoryCount: m.memories?.length || 0 })));
    } catch (err) {
      console.error('Error fetching family members:', err);
    }
  };

  const fetchRecentMemories = async (userId) => {
    try {
      const { data, error } = await supabase.from('memories').select(`
          *, family_members!inner (id, name, relationship, profile_photo_url, patient_id)
        `).eq('family_members.patient_id', userId).order('created_at', { ascending: false }).limit(3);
      if (error) throw error;
      setRecentMemories(data || []);
    } catch (err) {
      console.error('Error fetching recent memories:', err);
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
              <button 
                onClick={() => navigate('/patient/family-moments')} 
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-lg transition-all font-semibold shadow-md"
              >
                <Video className="w-4 h-4" />
                Family Moments
              </button>
              {patientInfo && (
                <button onClick={() => setShowProfile(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-white/50 rounded-lg transition-all">
                  <Info className="w-4 h-4" />
                  My Info
                </button>
              )}
              <button onClick={handleLogout} className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-white/50 rounded-lg transition-all">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid lg:grid-cols-4 gap-4">
          {/* Chat - 3/4 width */}
          <div className="lg:col-span-3">
            <ChatWindow patientId={patient.id} />
          </div>

          {/* Sidebar - 1/4 width */}
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

export default PatientDashboard;