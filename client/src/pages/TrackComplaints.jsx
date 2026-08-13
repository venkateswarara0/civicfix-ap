import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  MapPin, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  ArrowRight, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

export default function TrackComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMyComplaints();
  }, [user]);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('civicfix_token');
      const endpoint = token ? '/api/complaints/my' : '/api/complaints';
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(endpoint, { headers });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = complaints.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              <FileText className="w-7 h-7 text-cyan-400" /> My Reported Complaints
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Track real-time progress, official resolution photos, and confirm proof of work.
            </p>
          </div>

          <Link
            to="/report"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4" /> Report New Problem
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {['ALL', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  statusFilter === st
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Complaints Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="text-sm font-semibold">Loading reported issues...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 text-slate-500 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">No Complaints Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't reported any civic problems matching this criteria yet.
            </p>
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              Report a Problem Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Banner */}
                  <div className="relative h-44 overflow-hidden bg-slate-900">
                    <img
                      src={c.original_image_url}
                      alt={c.category_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-cyan-400 border border-slate-800">
                      #{c.tracking_id}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        c.status === 'RESOLVED' ? 'bg-emerald-500 text-slate-950' :
                        c.status === 'IN_PROGRESS' ? 'bg-amber-500 text-slate-950' :
                        c.status === 'REOPENED' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        {c.category_name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug">
                      {c.description}
                    </h3>

                    <div className="text-[11px] text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{c.address || `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{c.sachivalayam_name || 'Patamata Sachivalayam'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Priority: <strong className="text-slate-300">{c.priority}</strong></span>
                  <Link
                    to={`/complaints/${c.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-400 flex items-center gap-1 transition"
                  >
                    View Status & Proof <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
