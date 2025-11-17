// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Home
import Home from './pages/Home';

// Family pages
import FamilyDashboard from './pages/family/FamilyDashboard';
import FamilyLogin from './pages/family/FamilyLogin';
import FamilyRegister from './pages/family/FamilyRegister';

// Patient pages
import PatientLogin from './pages/patient/PatientLogin';
import PatientRegister from './pages/patient/PatientRegister'; // ADD THIS
import PatientDashboard from './pages/patient/PatientDashboard';
import FamilyMomentntsFeed from './pages/patient/FamilyMomentsFeed'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />
        
        {/* Family routes */}
        <Route path="/family/login" element={<FamilyLogin />} />
        <Route path="/family/register" element={<FamilyRegister />} />
        <Route path="/family/dashboard" element={<FamilyDashboard />} />
        <Route path="/patient/family-moments" element={<FamilyMomentntsFeed/>}/>
        {/* Patient routes */}
        <Route path="/patient/login" element={<PatientLogin />} />
        <Route path="/patient/register" element={<PatientRegister />} /> {/* ADD THIS */}
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        
        {/* Legacy routes - redirect to family */}
        <Route path="/login" element={<Navigate to="/family/login" replace />} />
        <Route path="/register" element={<Navigate to="/family/register" replace />} />
        <Route path="/dashboard" element={<Navigate to="/family/dashboard" replace />} />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;