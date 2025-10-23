import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, uploadFile } from '../../lib/supabase';
import { Loader2, User, Mail, Lock, Home, Phone, Upload, AlertCircle, CheckCircle } from 'lucide-react';

const PatientRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // Step 1: Account Info
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
  });

  // Step 2: Additional Info
  const [additionalInfo, setAdditionalInfo] = useState({
    homeAddress: '',
    homePhoto: null,
    emergencyContacts: [{ name: '', relationship: '', phone: '' }],
    doctorName: '',
    doctorPhone: '',
  });

  const [homePhotoPreview, setHomePhotoPreview] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdditionalInfoChange = (e) => {
    setAdditionalInfo({ ...additionalInfo, [e.target.name]: e.target.value });
  };

  const handleEmergencyContactChange = (index, field, value) => {
    const newContacts = [...additionalInfo.emergencyContacts];
    newContacts[index][field] = value;
    setAdditionalInfo({ ...additionalInfo, emergencyContacts: newContacts });
  };

  const addEmergencyContact = () => {
    setAdditionalInfo({
      ...additionalInfo,
      emergencyContacts: [...additionalInfo.emergencyContacts, { name: '', relationship: '', phone: '' }]
    });
  };

  const handleHomePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAdditionalInfo({ ...additionalInfo, homePhoto: file });
      setHomePhotoPreview(URL.createObjectURL(file));
    }
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.dateOfBirth) {
      setError('Please enter your date of birth');
      return false;
    }
    return true;
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setError('');
    
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // 2. Create patient record
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .insert([{
          id: authData.user.id, // Use auth user ID
          name: formData.name,
          date_of_birth: formData.dateOfBirth,
        }])
        .select()
        .single();

      if (patientError) throw patientError;

      // 3. Upload home photo if provided
      let homePhotoUrl = null;
      if (additionalInfo.homePhoto) {
        const fileName = `${authData.user.id}/home-photo-${Date.now()}`;
        const uploadResult = await uploadFile(
          'patient',
          fileName,
          additionalInfo.homePhoto,
          false // Don't require auth during registration
        );
        
        if (uploadResult.url) {
          homePhotoUrl = uploadResult.url;
        }
      }

      // 4. Create patient_info record
      const emergencyContactsData = additionalInfo.emergencyContacts
        .filter(contact => contact.name.trim() && contact.phone.trim())
        .map(contact => ({
          name: contact.name,
          relationship: contact.relationship,
          phone: contact.phone
        }));

      const { error: infoError } = await supabase
        .from('patient_info')
        .insert([{
          patient_id: patientData.id,
          home_address: additionalInfo.homeAddress || null,
          home_photo_url: homePhotoUrl,
          emergency_contacts: emergencyContactsData.length > 0 ? emergencyContactsData : null,
          doctor_name: additionalInfo.doctorName || null,
          doctor_phone: additionalInfo.doctorPhone || null,
        }]);

      if (infoError) throw infoError;

      // Success! Show message and redirect
      alert('Registration successful! Please check your email to verify your account, then you can login.');
      navigate('/patient/login');

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">RememberMe</h1>
            <p className="text-xl md:text-2xl text-gray-600">Patient Registration</p>
            <div className="flex justify-center items-center gap-4 mt-6">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <div className={`h-1 w-16 ${step >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                2
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <p className="text-red-600 text-lg">{error}</p>
            </div>
          )}

          {/* Step 1: Account Information */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-5">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Information</h2>

              {/* Name */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="At least 6 characters"
                    className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Re-enter your password"
                    className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Next Button */}
              <button
                type="submit"
                className="w-full py-5 text-xl bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-bold shadow-lg mt-6"
              >
                Next: Additional Information
              </button>
            </form>
          )}

          {/* Step 2: Additional Information */}
          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="space-y-5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Additional Information</h2>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-green-600 hover:text-green-700 font-semibold"
                >
                  ← Back
                </button>
              </div>

              <p className="text-gray-600 text-lg mb-4">This information will help your family members assist you better (optional)</p>

              {/* Home Address */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Home Address</label>
                <div className="relative">
                  <Home className="absolute left-4 top-4 w-6 h-6 text-gray-400" />
                  <textarea
                    name="homeAddress"
                    value={additionalInfo.homeAddress}
                    onChange={handleAdditionalInfoChange}
                    placeholder="Your home address"
                    rows="2"
                    className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Home Photo */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Home Photo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  {homePhotoPreview ? (
                    <div className="space-y-3">
                      <img src={homePhotoPreview} alt="Home preview" className="mx-auto h-40 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setHomePhotoPreview(null);
                          setAdditionalInfo({ ...additionalInfo, homePhoto: null });
                        }}
                        className="text-red-600 hover:text-red-700 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to upload a photo of your home</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHomePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Emergency Contacts */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">Emergency Contacts</label>
                {additionalInfo.emergencyContacts.map((contact, index) => (
                  <div key={index} className="space-y-3 p-4 bg-gray-50 rounded-xl mb-3">
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => handleEmergencyContactChange(index, 'name', e.target.value)}
                      placeholder="Contact name"
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={contact.relationship}
                      onChange={(e) => handleEmergencyContactChange(index, 'relationship', e.target.value)}
                      placeholder="Relationship (e.g., Daughter, Son)"
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => handleEmergencyContactChange(index, 'phone', e.target.value)}
                      placeholder="Phone number"
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEmergencyContact}
                  className="w-full py-3 text-lg border-2 border-green-500 text-green-600 rounded-xl hover:bg-green-50 transition-colors font-semibold"
                >
                  + Add Another Contact
                </button>
              </div>

              {/* Doctor Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">Doctor's Name</label>
                  <input
                    type="text"
                    name="doctorName"
                    value={additionalInfo.doctorName}
                    onChange={handleAdditionalInfoChange}
                    placeholder="Dr. Smith"
                    className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">Doctor's Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                    <input
                      type="tel"
                      name="doctorPhone"
                      value={additionalInfo.doctorPhone}
                      onChange={handleAdditionalInfoChange}
                      placeholder="Phone number"
                      className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 text-xl bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-bold shadow-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-7 h-7 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-7 h-7" />
                    Complete Registration
                  </>
                )}
              </button>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center">
            <p className="text-lg text-gray-600">
              Already have an account?{' '}
              <Link to="/patient/login" className="text-green-600 hover:text-green-700 font-semibold">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientRegister;