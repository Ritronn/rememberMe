// src/Pages/Patient/FamilyMoments.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Heart, User, Loader2, Video, AlertCircle, ArrowLeft, Play, Pause, Volume2, VolumeX } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

const FamilyMomentsFeed = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  const videoRefs = useRef([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        setLoading(true);
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Auth error:', authError);
          navigate('/patient/login');
          return;
        }

        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', user.id)
          .single();

        if (patientError) {
          console.error('Patient fetch error:', patientError);
          navigate('/patient/login');
          return;
        }

        setPatient(patientData);
        await fetchVideos(patientData.id);
        
      } catch (err) {
        console.error('Setup error:', err);
        setError('Failed to load page');
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [navigate]);

  const fetchVideos = async (patientId) => {
    try {
      setError('');

      if (!patientId) {
        throw new Error('Patient ID is required');
      }

      const response = await fetch(`${API_BASE}/videos/${patientId}/`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an error. Check Django console.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load videos');
      }

      setVideos(data);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  // Handle scroll to snap to videos
  useEffect(() => {
    if (videos.length === 0) return;

    const handleScroll = () => {
      if (!containerRef.current) return;

      const scrollTop = containerRef.current.scrollTop;
      const videoHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / videoHeight);

      if (newIndex !== currentVideoIndex && newIndex >= 0 && newIndex < videos.length) {
        setCurrentVideoIndex(newIndex);
        
        // Pause all videos
        videoRefs.current.forEach(video => {
          if (video) video.pause();
        });
        
        // Play current video
        const currentVideo = videoRefs.current[newIndex];
        if (currentVideo && isPlaying) {
          currentVideo.play().catch(err => console.log('Play error:', err));
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentVideoIndex, videos.length, isPlaying]);

  // Play/pause current video
  useEffect(() => {
    const currentVideo = videoRefs.current[currentVideoIndex];
    if (currentVideo) {
      if (isPlaying) {
        currentVideo.play().catch(err => console.log('Play error:', err));
      } else {
        currentVideo.pause();
      }
    }
  }, [isPlaying, currentVideoIndex]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const currentVideo = videoRefs.current[currentVideoIndex];
    if (currentVideo) {
      currentVideo.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-700 font-medium">Loading family moments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Oops!</h3>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-700 transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="w-8 h-8 text-purple-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Family Moments
                </h1>
              </div>
              <button
                onClick={() => navigate('/patient/dashboard')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white/50 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-12 text-center max-w-md border-2 border-white/20">
            <Video className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              No videos yet
            </h3>
            <p className="text-gray-500 text-lg">
              Your family will add special moments soon!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black overflow-hidden relative">
      {/* Header - Fixed */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Video className="w-6 h-6 text-white" />
              <h1 className="text-xl font-bold text-white">
                Family Moments
              </h1>
            </div>
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Video Container */}
      <div 
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {videos.map((video, index) => (
          <div 
            key={video.id} 
            className="h-screen w-full snap-start snap-always flex items-center justify-center relative bg-black"
          >
            {/* Video */}
            <video
              ref={el => videoRefs.current[index] = el}
              src={video.video_url}
              className="h-full w-auto max-w-full object-contain"
              loop
              playsInline
              muted={isMuted}
              onClick={togglePlayPause}
            />

            {/* Controls Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top gradient */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
              
              {/* Bottom gradient with info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pb-8">
                <div className="max-w-2xl mx-auto">
                  {/* Family member info */}
                  <div className="flex items-center gap-3 mb-4">
                    {video.family_members?.profile_photo_url ? (
                      <img
                        src={video.family_members.profile_photo_url}
                        alt={video.family_members.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center border-2 border-white">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white text-lg">
                        {video.family_members?.name || 'Unknown'}
                      </p>
                      <p className="text-white/80 text-sm">
                        Your {video.family_members?.relationship || 'family'} • {formatDate(video.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Title and description */}
                  <h3 className="text-white text-2xl font-bold mb-2">
                    {video.title}
                  </h3>
                  
                  {video.description && (
                    <p className="text-white/90 text-lg">
                      {video.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Side Controls */}
            <div className="absolute right-4 bottom-32 flex flex-col gap-6 pointer-events-auto">
              {/* Play/Pause */}
              <button
                onClick={togglePlayPause}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
              </button>

              {/* Mute/Unmute */}
              <button
                onClick={toggleMute}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                {isMuted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
              </button>

              {/* Like */}
              <button
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-red-500 hover:bg-white/30 transition-all"
              >
                <Heart className="w-7 h-7 fill-red-500" />
              </button>
            </div>

            {/* Scroll indicator */}
            {index < videos.length - 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/50 text-sm flex flex-col items-center gap-1 pointer-events-none animate-bounce">
                <span>Swipe up</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Video counter */}
      <div className="absolute top-20 right-6 z-50 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-semibold">
        {currentVideoIndex + 1} / {videos.length}
      </div>

      <style>{`
        /* Hide scrollbar */
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default FamilyMomentsFeed;