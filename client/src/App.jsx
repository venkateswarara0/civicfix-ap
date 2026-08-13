import React, { Component } from 'react';
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
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// Global Error Boundary to prevent blank dark screens
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CivicFix Portal Error Boundary Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Something went wrong</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              We encountered a temporary rendering issue. Tap reload below to refresh the CivicFix AP Portal.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg"
              >
                <RefreshCw className="w-4 h-4" /> Reload Portal
              </button>
              <a
                href="/"
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-2 border border-slate-700"
              >
                <Home className="w-4 h-4" /> Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
