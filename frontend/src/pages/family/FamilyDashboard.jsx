// src/pages/FamilyDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getCurrentUser, signOut } from '../../lib/supabase';
import MemoryList from '../../components/family/MemoryList';
import MemoryForm from '../../components/family/MemoryForm';
import VideoUploadForm from '../../components/family/VideoUploadForm';
import { Plus, LogOut, User, Mic, CheckCircle, Clock, XCircle, Loader2, Sparkles, Video } from 'lucide-react';

const FamilyDashboard = () => {
  const navigate = useNavigate();
  const [familyMember, setFamilyMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isVideoFormOpen, setIsVideoFormOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchFamilyMember();
  }, []);

  const fetchFamilyMember = async () => {
    try {
      setLoading(true);
      const { user, error: userError } = await getCurrentUser();
      
      if (userError || !user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('family_members')
        .select(`
          *,
          patient:patients(name)
        `)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setFamilyMember(data);
    } catch (err) {
      console.error('Error fetching family member:', err);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleCreateMemory = () => {
    setEditingMemory(null);
    setIsFormOpen(true);
  };

  const handleEditMemory = (memory) => {
    setEditingMemory(memory);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const VoiceStatus = ({ status }) => {
    const statusConfig = {
      pending: {
        icon: Clock,
        text: 'Voice Clone Pending',
        color: 'text-yellow-600',
        bg: 'bg-gradient-to-r from-yellow-50 to-orange-50',
        border: 'border-yellow-300'
      },
      processing: {
        icon: Loader2,
        text: 'Voice Clone Processing...',
        color: 'text-blue-600',
        bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
        border: 'border-blue-300',
        spin: true
      },
      ready: {
        icon: CheckCircle,
        text: 'Voice Clone Ready',
        color: 'text-green-600',
        bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
        border: 'border-green-300'
      },
      failed: {
        icon: XCircle,
        text: 'Voice Clone Failed',
        color: 'text-red-600',
        bg: 'bg-gradient-to-r from-red-50 to-pink-50',
        border: 'border-red-300'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${config.bg} ${config.border} shadow-md backdrop-blur-sm`}>
        <div className="p-1.5 bg-white/70 rounded-md">
          <Mic className="w-4 h-4 text-purple-600" />
        </div>
        <Icon className={`w-4 h-4 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
        <span className={`text-xs font-semibold ${config.color}`}>
          {config.text}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="text-center relative z-10">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-700 font-medium text-sm">Loading your memories...</p>
        </div>
      </div>
    );
  }

  if (!familyMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
          <p className="text-gray-600 mb-3 text-sm">Unable to load dashboard</p>
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-medium shadow-md"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  RememberMe
                </h1>
                <p className="text-xs text-gray-500 font-medium">Family Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-gray-900">{familyMember.name}</p>
                <p className="text-xs text-gray-500">
                  {familyMember.relationship} of {familyMember.patient?.name}
                </p>
              </div>
              {familyMember.profile_photo_url ? (
                <img
                  src={familyMember.profile_photo_url}
                  alt={familyMember.name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-purple-200 shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-white/60 rounded-lg transition-all duration-300 font-medium border border-transparent hover:border-gray-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Voice Status Card */}
        <div className="mb-6">
          <VoiceStatus status={familyMember.voice_clone_status} />
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-0.5">My Memories</h2>
            <p className="text-xs text-gray-600 font-medium">
              Create and manage memories for <span className="text-purple-600 font-semibold">{familyMember.patient?.name}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsVideoFormOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 font-semibold shadow-md"
            >
              <Video className="w-4 h-4" />
              <span>Upload Video</span>
            </button>
            <button
              onClick={handleCreateMemory}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>New Memory</span>
            </button>
          </div>
        </div>

        {/* Memory List */}
        <MemoryList
          familyMemberId={familyMember.id}
          onEdit={handleEditMemory}
          refreshTrigger={refreshTrigger}
        />
      </main>

      {/* Memory Form Modal */}
      <MemoryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        familyMemberId={familyMember.id}
        editingMemory={editingMemory}
        onSuccess={handleFormSuccess}
      />

      {/* Video Upload Modal */}
      <VideoUploadForm
        isOpen={isVideoFormOpen}
        onClose={() => setIsVideoFormOpen(false)}
        familyMemberId={familyMember.id}
        onSuccess={handleFormSuccess}
      />

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

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default FamilyDashboard;