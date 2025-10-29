import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, uploadFile } from '../../lib/supabase';
import { Upload, Loader2, User, ChevronRight, ChevronLeft, Sparkles, AlertCircle, ArrowLeft, FileAudio } from 'lucide-react';

// Hardcoded patient ID - matches the patient record in database
const PATIENT_ID = '0c02b145-5b4d-456a-bfe3-50d442adf57f';

const FamilyRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Voice Upload
  
  // Form data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [relationship, setRelationship] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  
  // Voice upload
  const [voiceFile, setVoiceFile] = useState(null);
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle profile photo
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  // Handle voice file
  const handleVoiceChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVoiceFile(file);
    }
  };

  // Validation
  const validateStep1 = () => {
    if (!name.trim()) return 'Name is required';
    if (!email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Invalid email format';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    if (!relationship) return 'Relationship is required';
    return null;
  };

  const validateStep2 = () => {
    if (!voiceFile) return 'Please upload a voice sample';
    if (!voiceFile.name.endsWith('.wav')) return 'Only WAV format is supported';
    return null;
  };

  // Handle next step
  const handleNextStep = () => {
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep(2);
  };

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    
    const validationError = validateStep2();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      const userId = authData.user.id;

      // Step 2: Upload profile photo if provided
      let profilePhotoUrl = null;
      if (profilePhoto) {
        const photoFileName = `${userId}-${Date.now()}-${profilePhoto.name}`;
        const { url, error: photoError } = await uploadFile('profiles', photoFileName, profilePhoto, false);
        if (photoError) throw photoError;
        profilePhotoUrl = url;
      }

      // Step 3: Register family member in Django backend
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('patient_id', PATIENT_ID);
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('relationship', relationship);
      if (profilePhotoUrl) {
        formData.append('profile_photo_url', profilePhotoUrl);
      }

      const registerRes = await fetch('http://127.0.0.1:8000/api/register/', {
        method: 'POST',
        body: formData
      });
      
      const registerData = await registerRes.json();
      if (!registerRes.ok) {
        throw new Error(registerData.error || 'Registration failed');
      }
      
      const familyMemberId = registerData.family_member_id;

      // Step 4: Upload voice sample
      const voiceFileName = `${userId}-${Date.now()}.wav`;
      const { url: voiceSampleUrl, error: voiceUploadError } = await uploadFile(
        'voice-samples',
        voiceFileName,
        voiceFile,
        false
      );
      if (voiceUploadError) throw voiceUploadError;

      // Step 5: Update voice in Django backend
      const voiceFormData = new FormData();
      voiceFormData.append('family_member_id', familyMemberId);
      voiceFormData.append('voice_sample_url', voiceSampleUrl);

      const voiceRes = await fetch('http://127.0.0.1:8000/api/upload-voice/', {
        method: 'POST',
        body: voiceFormData
      });
      
      const voiceData = await voiceRes.json();
      if (!voiceRes.ok) {
        throw new Error(voiceData.error || 'Voice upload failed');
      }

      // Success - navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated gradient background */}
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

      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:scale-105 z-50 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Home</span>
      </button>

      {/* Registration Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl max-w-md w-full p-8 md:p-10 relative z-10 animate-slide-up">
        {/* Logo/Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              RememberMe
            </h1>
          </div>
          <p className="text-gray-600 text-lg font-medium">Family Member Registration</p>
          <div className="mt-2 h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 transition-all duration-300 ${
            step >= 1 
              ? 'bg-blue-500 border-blue-500 text-white shadow-lg transform scale-110' 
              : 'bg-white border-gray-200 text-gray-400'
          } font-semibold`}>
            1
          </div>
          <div className={`w-16 h-2 rounded-full transition-all duration-300 ${
            step >= 2 ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-200'
          }`} />
          <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 transition-all duration-300 ${
            step >= 2 
              ? 'bg-purple-500 border-purple-500 text-white shadow-lg transform scale-110' 
              : 'bg-white border-gray-200 text-gray-400'
          } font-semibold`}>
            2
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
            {/* Name */}
            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50 focus:bg-white"
                required
              />
            </div>

            {/* Email */}
            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50 focus:bg-white"
                required
              />
            </div>

            {/* Password */}
            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50 focus:bg-white"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50 focus:bg-white"
                required
              />
            </div>

            {/* Relationship */}
            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Relationship to Patient *
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50 focus:bg-white appearance-none"
                required
              >
                <option value="">Select relationship</option>
                <option value="Daughter">Daughter</option>
                <option value="Son">Son</option>
                <option value="Son">Son</option>
                <option value="Wife">Wife</option>
                <option value="Husband">Husband</option>
                <option value="Granddaughter">Granddaughter</option>
                <option value="Grandson">Grandson</option>
                <option value="Sister">Sister</option>
                <option value="Brother">Brother</option>
                <option value="Friend">Friend</option>
                <option value="Caregiver">Caregiver</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Profile Photo */}
            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Profile Photo (Optional)
              </label>
              <div className="flex items-center gap-4">
                {profilePhotoPreview ? (
                  <img
                    src={profilePhotoPreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-purple-200 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-200 shadow-sm">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all duration-300 group">
                  <Upload className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Next button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Next: Voice Upload
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Login link */}
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-100">
              <p className="text-sm text-gray-700">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-purple-600 font-bold transition-colors hover:underline"
                >
                  Login here
                </Link>
              </p>
            </div>
          </form>
        )}

        {/* Step 2: Voice Upload */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center animate-fade-in">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Upload Voice Sample
              </h3>
              <p className="text-gray-600 font-medium">
                Upload a 30+ second audio file (WAV format) for voice cloning
              </p>
            </div>

            {/* File upload interface */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 space-y-6 border-2 border-blue-100 shadow-inner">
              <label className="flex flex-col items-center gap-4 cursor-pointer group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300 transform group-hover:scale-110">
                  {voiceFile ? (
                    <FileAudio className="w-12 h-12 text-green-600" />
                  ) : (
                    <Upload className="w-12 h-12 text-blue-500 group-hover:text-purple-500 transition-colors" />
                  )}
                </div>
                <div className="text-center">
                  <span className="text-lg font-semibold text-gray-700 block mb-1">
                    {voiceFile ? voiceFile.name : 'Click to upload voice sample'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {voiceFile ? `${(voiceFile.size / 1024 / 1024).toFixed(2)} MB` : 'WAV format only'}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".wav,audio/wav"
                  onChange={handleVoiceChange}
                  className="hidden"
                />
              </label>

              {voiceFile && (
                <button
                  type="button"
                  onClick={() => setVoiceFile(null)}
                  className="w-full px-4 py-2 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-medium transition-all duration-300"
                >
                  Remove File
                </button>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 font-semibold transition-all duration-300 transform hover:scale-105"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <button
                type="button"
                onClick={handleRegister}
                disabled={loading || !voiceFile}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

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

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
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

        .animate-fade-in {
          animation: fade-in 1s ease-out;
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

export default FamilyRegister;