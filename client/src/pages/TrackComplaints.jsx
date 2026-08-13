import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  PlusCircle, 
  ArrowRight, 
  RefreshCw,
  Search,
  ChevronRight
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
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.tracking_id && c.tracking_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.category_name && c.category_name.toLowerCase().includes(searchQuery.toLowerCase()));
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
            {['ALL', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED'].map((st) => {
              const count = st === 'ALL'
                ? complaints.length
                : complaints.filter(c => c.status === st).length;

              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    statusFilter === st
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{st}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === st ? 'bg-slate-950 text-emerald-400 font-mono' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
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
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">No Complaints Found for filter: {statusFilter}</h3>
            
            {complaints.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-amber-400">
                  You have <strong>{complaints.length} complaint(s)</strong> under other status tabs (e.g. SUBMITTED).
                </p>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg"
                >
                  Show All {complaints.length} Reported Complaints
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">You haven't reported any civic problems yet.</p>
                <Link
                  to="/report"
                  className="inline-flex px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  Report a Problem Now
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <Link
                key={c.id}
                to={`/complaints/${c.id}`}
                className="glass-card p-5 rounded-3xl border border-slate-800 hover:border-cyan-500/50 space-y-4 transition-all group shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[11px]">
                      {c.category_name}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                      c.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' :
                      c.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' :
                      c.status === 'REOPENED' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="font-mono text-[10px] text-cyan-400 font-bold">#{c.tracking_id}</div>
                    <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-cyan-400 transition">
                      {c.description}
                    </h3>
                  </div>

                  {c.original_image_url && (
                    <div className="h-36 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 relative">
                      <img
                        src={c.original_image_url}
                        alt={c.category_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{c.address || `${c.lat}, ${c.lng}`}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate text-emerald-400">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{c.sachivalayam_name || 'Gudivada Municipal Ward Sachivalayam 05'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="w-full py-2.5 rounded-xl bg-slate-900 group-hover:bg-cyan-500 group-hover:text-slate-950 font-extrabold text-xs text-slate-300 flex items-center justify-center gap-1.5 transition">
                    View Live Resolution Proof <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
