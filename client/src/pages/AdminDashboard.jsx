import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import InteractiveMap from '../components/InteractiveMap';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  Plus, 
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [sachivalayams, setSachivalayams] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Sachivalayam Modal state
  const [showAddSachivalayamModal, setShowAddSachivalayamModal] = useState(false);
  const [newSachivalayam, setNewSachivalayam] = useState({
    name: '',
    code: '',
    district: 'NTR District',
    mandal: 'Vijayawada Urban',
    village: '',
    lat: '16.5000',
    lng: '80.6400',
    official_name: '',
    contact_phone: ''
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('civicfix_token');

      // 1. Fetch Analytics
      const analyticsRes = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      // 2. Fetch Sachivalayams
      const sachRes = await fetch('/api/sachivalayams');
      if (sachRes.ok) {
        const data = await sachRes.json();
        setSachivalayams(data.sachivalayams || []);
      }

      // 3. Fetch All Complaints
      const compRes = await fetch('/api/complaints');
      if (compRes.ok) {
        const data = await compRes.json();
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSachivalayam = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('civicfix_token');
      const res = await fetch('/api/admin/sachivalayams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSachivalayam)
      });

      if (res.ok) {
        setShowAddSachivalayamModal(false);
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create Sachivalayam');
      }
    } catch (err) {
      console.error('Create Sachivalayam error:', err);
    }
  };

  const metrics = analytics?.metrics || {
    total: complaints.length,
    new: complaints.filter(c => c.status === 'SUBMITTED').length,
    in_progress: complaints.filter(c => c.status === 'IN_PROGRESS').length,
    resolved: complaints.filter(c => c.status === 'RESOLVED').length,
    reopened: complaints.filter(c => c.status === 'REOPENED').length,
    avg_resolution_hours: 24.0
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard className="w-6 h-6 text-purple-400" />
              <span className="text-xs uppercase font-extrabold text-purple-400 tracking-wider">State Administrative Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">AP CivicFix Analytics & Management</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Overview of civic complaints across Andhra Pradesh Grama/Ward Sachivalayams.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddSachivalayamModal(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add Sachivalayam Location
            </button>

            <button
              onClick={fetchAdminData}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="glass-card p-4 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Reported</div>
            <div className="text-2xl font-black text-white">{metrics.total}</div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-blue-500/30">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">New</div>
            <div className="text-2xl font-black text-blue-400">{metrics.new}</div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-amber-500/30">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">In Progress</div>
            <div className="text-2xl font-black text-amber-400">{metrics.in_progress}</div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-emerald-500/30">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Resolved</div>
            <div className="text-2xl font-black text-emerald-400">{metrics.resolved}</div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-red-500/30">
            <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Reopened</div>
            <div className="text-2xl font-black text-red-400">{metrics.reopened}</div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-cyan-500/30 col-span-2 lg:col-span-1">
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">Avg Resolution</div>
            <div className="text-2xl font-black text-cyan-400">{metrics.avg_resolution_hours}h</div>
          </div>
        </div>

        {/* Map Heatmap & Problem Hotspots */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-400" /> Regional Hotspot Map Distribution
                </h3>
                <p className="text-xs text-slate-400">All complaint locations across registered AP Sachivalayams.</p>
              </div>
              <span className="text-xs text-purple-400 font-bold bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/30">
                {complaints.length} Active Pins
              </span>
            </div>

            <InteractiveMap complaints={complaints} height="h-[380px]" defaultCenter={[16.4975, 80.6552]} zoom={11} />
          </div>

          {/* Top Problem Hotspots List */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" /> High-Frequency Problem Hotspots
            </h3>
            
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {(analytics?.hotspots || []).length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-10">No hotspot clusters detected yet</div>
              ) : (
                (analytics?.hotspots || []).map((h, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-amber-400">Hotspot #{i + 1}</span>
                      <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                        {h.report_count} Reports
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 font-semibold truncate">{h.address || `${h.lat}, ${h.lng}`}</div>
                    <div className="text-[10px] text-slate-400">Category: {h.category_name}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* SACHIVALAYAM DIRECTORY MANAGEMENT */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" /> Registered Grama & Ward Sachivalayams
              </h3>
              <p className="text-xs text-slate-400">Manage jurisdiction boundaries, official assignments, and local performance.</p>
            </div>

            <button
              onClick={() => setShowAddSachivalayamModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-emerald-400" /> Register Sachivalayam
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 uppercase font-bold text-[10px] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Sachivalayam Name</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">District / Mandal</th>
                  <th className="p-3">Total Issues</th>
                  <th className="p-3">Resolved</th>
                  <th className="p-3">Pending</th>
                  <th className="p-3">Official Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sachivalayams.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-white">{s.name}</td>
                    <td className="p-3 font-mono text-cyan-400">{s.code}</td>
                    <td className="p-3">{s.district}, {s.mandal}</td>
                    <td className="p-3 font-bold text-slate-200">{s.total_complaints || 0}</td>
                    <td className="p-3 text-emerald-400 font-bold">{s.resolved_complaints || 0}</td>
                    <td className="p-3 text-amber-400 font-bold">{s.pending_complaints || 0}</td>
                    <td className="p-3 text-slate-400">{s.official_name || 'Assigned'} ({s.contact_phone || 'N/A'})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* CREATE NEW SACHIVALAYAM MODAL */}
      {showAddSachivalayamModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateSachivalayam} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Register New Sachivalayam</h3>
              <button type="button" onClick={() => setShowAddSachivalayamModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Sachivalayam Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gajuwaka Ward Sachivalayam 04"
                  value={newSachivalayam.name}
                  onChange={(e) => setNewSachivalayam({ ...newSachivalayam, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Code</label>
                <input
                  type="text"
                  required
                  placeholder="AP-VSK-GAJ-004"
                  value={newSachivalayam.code}
                  onChange={(e) => setNewSachivalayam({ ...newSachivalayam, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">District</label>
                <input
                  type="text"
                  required
                  value={newSachivalayam.district}
                  onChange={(e) => setNewSachivalayam({ ...newSachivalayam, district: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Mandal / Village</label>
                <input
                  type="text"
                  required
                  value={newSachivalayam.mandal}
                  onChange={(e) => setNewSachivalayam({ ...newSachivalayam, mandal: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Center Latitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newSachivalayam.lat}
                  onChange={(e) => setNewSachivalayam({ ...newSachivalayam, lat: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Center Longitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newSachivalayam.lng}
                  onChange={(e) => setNewSachivalayam({ ...newSachivalayam, lng: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAddSachivalayamModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs">
                Save Sachivalayam
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
