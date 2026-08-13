import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, User, Lock, Mail, Phone, Building2, ArrowRight, Loader2, UserCheck, PlusCircle, MapPin } from 'lucide-react';

export default function AuthPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('CITIZEN'); // CITIZEN or OFFICIAL
  
  // Sachivalayam mode for Officials: 'EXISTING' or 'NEW'
  const [sachivalayamMode, setSachivalayamMode] = useState('NEW');
  const [sachivalayamId, setSachivalayamId] = useState('');
  const [sachivalayams, setSachivalayams] = useState([]);
  
  // Custom Sachivalayam input for ANY AP area
  const [customSachName, setCustomSachName] = useState('');
  const [customDistrict, setCustomDistrict] = useState('Krishna District');
  const [customMandal, setCustomMandal] = useState('Gudivada Mandal');
  const [customVillage, setCustomVillage] = useState('Gudivada Town');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSachivalayams();
  }, []);

  const fetchSachivalayams = async () => {
    try {
      const res = await fetch('/api/sachivalayams');
      if (res.ok) {
        const data = await res.json();
        setSachivalayams(data.sachivalayams || []);
        if (data.sachivalayams && data.sachivalayams.length > 0) {
          const gudivada = data.sachivalayams.find(s => s.id === 6);
          setSachivalayamId(gudivada ? '6' : String(data.sachivalayams[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to load Sachivalayams list:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    let body = { email, password };
    if (isRegister) {
      body = {
        name,
        email,
        password,
        phone,
        role,
        sachivalayam_id: (role === 'OFFICIAL' && sachivalayamMode === 'EXISTING') ? sachivalayamId : null,
        custom_sachivalayam: (role === 'OFFICIAL' && sachivalayamMode === 'NEW') ? {
          sachivalayam_name: customSachName || `${customVillage} Ward/Grama Sachivalayam`,
          district: customDistrict,
          mandal: customMandal,
          village: customVillage
        } : null
      };
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const contentType = res.headers.get('content-type');
      let data = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { error: `Server error (${res.status}): ${text.substring(0, 100)}` };
      }

      if (res.ok) {
        login(data.token, data.user);
        if (data.user.role === 'ADMIN') navigate('/admin/dashboard');
        else if (data.user.role === 'OFFICIAL') navigate('/official/dashboard');
        else navigate('/report');
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Connection error: Unable to reach authentication server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        
        {/* Logo Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-xl shadow-emerald-500/20 mx-auto">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white">CivicFix AP Portal</h1>
          <p className="text-xs text-slate-400">
            {isRegister ? 'Register as a Citizen or Sachivalayam Head' : 'Sign in to your Citizen or Sachivalayam Account'}
          </p>
        </div>

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 shadow-2xl">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Registration Role Switcher */}
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">I am registering as *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('CITIZEN')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                    role === 'CITIZEN'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Local Citizen</div>
                    <div className="text-[10px] opacity-75">Report problems</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('OFFICIAL')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                    role === 'OFFICIAL'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Sachivalayam Head</div>
                    <div className="text-[10px] opacity-75">Resolve issues</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Sachivalayam Jurisdiction Form for Officials */}
          {isRegister && role === 'OFFICIAL' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> Sachivalayam Jurisdiction *
                </label>

                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSachivalayamMode('NEW')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sachivalayamMode === 'NEW' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Enter My Area
                  </button>
                  <button
                    type="button"
                    onClick={() => setSachivalayamMode('EXISTING')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sachivalayamMode === 'EXISTING' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Select List
                  </button>
                </div>
              </div>

              {sachivalayamMode === 'NEW' ? (
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">District (AP) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Krishna District, NTR District, Visakhapatnam..."
                      value={customDistrict}
                      onChange={(e) => setCustomDistrict(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Mandal / Municipality *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Gudivada, Gajuwaka..."
                        value={customMandal}
                        onChange={(e) => setCustomMandal(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Village / Town Ward *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bommuluru, Ward 05..."
                        value={customVillage}
                        onChange={(e) => setCustomVillage(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Sachivalayam Name & Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gudivada Municipal Ward Sachivalayam 05"
                      value={customSachName}
                      onChange={(e) => setCustomSachName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1 pt-1">
                  <select
                    value={sachivalayamId}
                    onChange={(e) => setSachivalayamId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    {sachivalayams.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.village}, {s.district})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p className="text-[10px] text-slate-400 leading-tight">
                Registered Sachivalayam Head will manage and resolve all civic complaints reported in this jurisdiction.
              </p>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder={role === 'OFFICIAL' ? 'e.g. P. Srinivas (Ward Secretary)' : 'e.g. Ramesh Kumar'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder={role === 'OFFICIAL' ? 'official.gudivada@civicfix.in' : 'citizen@gmail.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Mobile Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="+91 98480 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition ${
              role === 'OFFICIAL' && isRegister 
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                {isRegister ? (role === 'OFFICIAL' ? 'Register Sachivalayam Head' : 'Create Citizen Account') : 'Sign In'} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-slate-400 hover:text-emerald-400 transition"
            >
              {isRegister ? 'Already have an account? Sign In' : 'New user? Create your account'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
