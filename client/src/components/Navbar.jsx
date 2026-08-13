import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  PlusCircle, 
  FileText, 
  Building2, 
  LayoutDashboard, 
  Bell, 
  LogOut, 
  User, 
  CheckCircle2, 
  Sparkles,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('civicfix_token');
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleDemoLogin = async (email) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        if (data.user.role === 'ADMIN') navigate('/admin/dashboard');
        else if (data.user.role === 'OFFICIAL') navigate('/official/dashboard');
        else navigate('/track');
      }
    } catch (err) {
      console.error('Demo login error:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Region Badge */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  CivicFix
                </span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">AP Sachivalayam Portal</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Home
            </Link>

            <Link
              to="/report"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all ${
                location.pathname === '/report'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Report Problem
            </Link>

            <Link
              to="/track"
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                location.pathname === '/track' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              My Reports
            </Link>

            {user?.role === 'OFFICIAL' && (
              <Link
                to="/official/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  location.pathname.startsWith('/official') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Building2 className="w-4 h-4 text-amber-400" />
                Sachivalayam Portal
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  location.pathname.startsWith('/admin') ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-purple-400" />
                Admin Dashboard
              </Link>
            )}
          </div>

          {/* User & Demo Switcher */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Quick Demo Login Switcher */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg hover:border-slate-600 transition">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo Accounts</span>
              </button>
              
              <div className="absolute right-0 top-full mt-1 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Quick Switch Persona</div>
                <button
                  onClick={() => handleDemoLogin('citizen@civicfix.in')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                >
                  <span>👤 Citizen (Ravi)</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">User</span>
                </button>
                <button
                  onClick={() => handleDemoLogin('official.patamata@civicfix.in')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                >
                  <span>🏛️ Official (Patamata)</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">Officer</span>
                </button>
                <button
                  onClick={() => handleDemoLogin('admin@civicfix.in')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                >
                  <span>🛡️ State Admin</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Admin</span>
                </button>
              </div>
            </div>

            {/* Notifications Icon */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-slate-950 font-extrabold text-[10px] rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Modal Popup */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-200">Notifications</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{notifications.length} updates</span>
                    </div>

                    <div className="max-h-64 overflow-y-auto mt-2 space-y-2">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-500">No new notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300">
                            <p className="leading-tight">{n.message}</p>
                            <span className="text-[9px] text-slate-500 block mt-1">{new Date(n.created_at).toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile / Logout */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">{user.role}</span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-200 font-medium"
          >
            Home
          </Link>
          <Link
            to="/report"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-center"
          >
            📸 Report a Problem
          </Link>
          <Link
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-200 font-medium"
          >
            📋 My Reports
          </Link>

          {user?.role === 'OFFICIAL' && (
            <Link
              to="/official/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 font-medium"
            >
              🏛️ Official Dashboard
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg bg-purple-500/20 text-purple-400 font-medium"
            >
              🛡️ Admin Dashboard
            </Link>
          )}

          {/* Demo account quick login on mobile */}
          <div className="pt-2 border-t border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase font-bold px-2">Quick Switch Account</div>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => { handleDemoLogin('citizen@civicfix.in'); setMobileMenuOpen(false); }}
                className="text-[11px] bg-slate-800 p-1.5 rounded text-slate-300"
              >
                👤 Citizen
              </button>
              <button
                onClick={() => { handleDemoLogin('official.patamata@civicfix.in'); setMobileMenuOpen(false); }}
                className="text-[11px] bg-slate-800 p-1.5 rounded text-amber-400"
              >
                🏛️ Official
              </button>
              <button
                onClick={() => { handleDemoLogin('admin@civicfix.in'); setMobileMenuOpen(false); }}
                className="text-[11px] bg-slate-800 p-1.5 rounded text-purple-400"
              >
                🛡️ Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
