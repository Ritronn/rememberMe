// src/Pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Heart, ArrowRight, Mic, Brain, Image as ImageIcon, Sparkles } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
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
        <div className="particle particle-5"></div>
        <div className="particle particle-6"></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              RememberMe
            </h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-slide-up">
            Keep Memories Alive with AI
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-4 animate-slide-up animation-delay-200">
            An AI-powered care app helping Alzheimer's patients recognize family members and recall precious memories through voice cloning and intelligent assistance.
          </p>
          <div className="flex items-center justify-center gap-3 text-lg text-gray-500 animate-slide-up animation-delay-400">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all hover:scale-105">
              <Mic className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Voice</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all hover:scale-105">
              <Brain className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Text</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all hover:scale-105">
              <ImageIcon className="w-5 h-5 text-pink-600" />
              <span className="font-medium">Images</span>
            </div>
          </div>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-24">
          {/* Family Portal Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 animate-slide-up animation-delay-600 group">
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 transform -skew-y-6 group-hover:skew-y-6 transition-transform duration-700"></div>
              <Users className="w-16 h-16 mb-4 relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-3xl font-bold mb-2 relative z-10">Family Portal</h3>
              <p className="text-blue-100 text-lg relative z-10">
                Create and manage memories for your loved one
              </p>
            </div>

            <div className="p-8 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 transform hover:translate-x-2 transition-transform duration-200">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <p className="text-gray-700 font-medium">Record your voice for AI cloning</p>
                </div>
                <div className="flex items-start gap-3 transform hover:translate-x-2 transition-transform duration-200">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <p className="text-gray-700 font-medium">Add memories with photos and stories</p>
                </div>
                <div className="flex items-start gap-3 transform hover:translate-x-2 transition-transform duration-200">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <p className="text-gray-700 font-medium">Memories converted to audio in your voice</p>
                </div>
              </div>

              <div className="pt-6 space-y-3">
                <button
                  onClick={() => navigate('/family/register')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate('/family/login')}
                  className="w-full px-6 py-4 border-2 border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-300 font-semibold text-lg transform hover:scale-105"
                >
                  Login
                </button>
              </div>
            </div>
          </div>

          {/* Patient Portal Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 animate-slide-up animation-delay-800 group">
            <div className="bg-gradient-to-br from-green-500 via-green-600 to-teal-600 p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 transform -skew-y-6 group-hover:skew-y-6 transition-transform duration-700"></div>
              <Heart className="w-16 h-16 mb-4 relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-3xl font-bold mb-2 relative z-10">Patient Portal</h3>
              <p className="text-green-100 text-lg relative z-10">
                Simple interface to explore your memories
              </p>
            </div>

            <div className="p-8 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 transform hover:translate-x-2 transition-transform duration-200">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <p className="text-gray-700 font-medium">Ask questions by voice or text</p>
                </div>
                <div className="flex items-start gap-3 transform hover:translate-x-2 transition-transform duration-200">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <p className="text-gray-700 font-medium">See photos of family members</p>
                </div>
                <div className="flex items-start gap-3 transform hover:translate-x-2 transition-transform duration-200">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <p className="text-gray-700 font-medium">Hear memories in familiar voices</p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => navigate('/patient/login')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl hover:from-green-600 hover:to-teal-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Patient Login
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="pt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl">
                <p className="text-sm text-gray-700 text-center">
                  <span className="font-semibold">Need help?</span> Ask your family member to assist you
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="text-center animate-fade-in animation-delay-1000">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Powered by Multimodal AI
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Combining voice cloning, natural language processing, and image recognition to create meaningful connections
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Voice AI</h4>
              <p className="text-gray-600">Clone family voices for personalized audio memories</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animation-delay-200">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">NLP Understanding</h4>
              <p className="text-gray-600">Natural conversation to find the right memories</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animation-delay-400">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <ImageIcon className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Image Recognition</h4>
              <p className="text-gray-600">Visual memories to recognize loved ones</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md mt-24 py-8 border-t border-white/20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600">
          <p className="text-lg">
            RememberMe - Helping families stay connected through AI
          </p>
        </div>
      </footer>

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

        .particle-5 {
          width: 50px;
          height: 50px;
          top: 50%;
          left: 50%;
          animation-delay: 4s;
          animation-duration: 6s;
        }

        .particle-6 {
          width: 90px;
          height: 90px;
          top: 20%;
          left: 40%;
          animation-delay: 1.5s;
          animation-duration: 10s;
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

        .animation-delay-200 {
          animation-delay: 0.2s;
          animation-fill-mode: both;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
          animation-fill-mode: both;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
          animation-fill-mode: both;
        }

        .animation-delay-800 {
          animation-delay: 0.8s;
          animation-fill-mode: both;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
};

export default Home;