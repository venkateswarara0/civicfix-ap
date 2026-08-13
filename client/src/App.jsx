import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import ReportWizard from './pages/ReportWizard';
import TrackComplaints from './pages/TrackComplaints';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import OfficialDashboard from './pages/OfficialDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';

// Protected Route Guards
function ProtectedOfficialRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || (user.role !== 'OFFICIAL' && user.role !== 'ADMIN')) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/report" element={<ReportWizard />} />
              <Route path="/track" element={<TrackComplaints />} />
              <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
              <Route
                path="/official/dashboard"
                element={
                  <ProtectedOfficialRoute>
                    <OfficialDashboard />
                  </ProtectedOfficialRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route path="/login" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
