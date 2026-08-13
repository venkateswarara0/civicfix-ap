import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CameraCapture from '../components/CameraCapture';
import InteractiveMap from '../components/InteractiveMap';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Upload, 
  MapPin, 
  ShieldAlert, 
  Play, 
  Check, 
  XCircle,
  FileText,
  SlidersHorizontal,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function OfficialDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Selected complaint modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusRemarks, setStatusRemarks] = useState('');

  // Resolution upload state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionFile, setResolutionFile] = useState(null);
  const [resolutionDataUrl, setResolutionDataUrl] = useState(null);
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  useEffect(() => {
    fetchAssignedComplaints();
  }, [statusFilter]);

  const fetchAssignedComplaints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('civicfix_token');
      const url = statusFilter === 'ALL' ? '/api/complaints' : `/api/complaints?status=${statusFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load official complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      const token = localStorage.getItem('civicfix_token');
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          remarks: statusRemarks || `Updated to ${newStatus}`
        })
      });

      if (res.ok) {
        setStatusRemarks('');
        setSelectedComplaint(null);
        fetchAssignedComplaints();
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionFile && !resolutionDataUrl) {
      alert('Photo evidence of resolution is required!');
      return;
    }

    setSubmittingResolution(true);
    try {
      const formData = new FormData();
      if (resolutionFile) formData.append('resolution_image', resolutionFile);
      else if (resolutionDataUrl) formData.append('resolution_image_url', resolutionDataUrl);

      formData.append('remarks', resolutionRemarks || 'Issue fixed on site.');

      const token = localStorage.getItem('civicfix_token');
      const res = await fetch(`/api/complaints/${selectedComplaint.id}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setShowResolveModal(false);
        setSelectedComplaint(null);
        setResolutionFile(null);
        setResolutionDataUrl(null);
        setResolutionRemarks('');
        fetchAssignedComplaints();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to submit resolution proof');
      }
    } catch (err) {
      console.error('Resolve error:', err);
    } finally {
      setSubmittingResolution(false);
    }
  };

  // Compute Statistics
  const totalCount = complaints.length;
  const newCount = complaints.filter(c => c.status === 'SUBMITTED' || c.status === 'ASSIGNED').length;
  const inProgressCount = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length;
  const reopenedCount = complaints.filter(c => c.status === 'REOPENED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-6 h-6 text-amber-400" />
              <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">AP Grama/Ward Sachivalayam Official Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {user?.sachivalayam_id ? 'Patamata Ward Sachivalayam 14' : 'Grama/Ward Sachivalayam Workspace'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Logged in as: <strong className="text-slate-200">{user?.name}</strong> • Phone: +91 98480 12345
            </p>
          </div>

          <button
            onClick={fetchAssignedComplaints}
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Feed
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Issues</div>
            <div className="text-2xl font-black text-white">{totalCount}</div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-blue-500/30">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">New / Assigned</div>
            <div className="text-2xl font-black text-blue-400">{newCount}</div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-amber-500/30">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">In Progress</div>
            <div className="text-2xl font-black text-amber-400">{inProgressCount}</div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-emerald-500/30">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Resolved</div>
            <div className="text-2xl font-black text-emerald-400">{resolvedCount}</div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-red-500/30 col-span-2 lg:col-span-1">
            <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Reopened Alert</div>
            <div className="text-2xl font-black text-red-400">{reopenedCount}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          {['ALL', 'SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Main Complaints List Cards */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl text-center text-slate-400 space-y-2">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-200">No complaints matching filter</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-amber-500/30 transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 bg-slate-900">
                    <img src={c.original_image_url} alt={c.category_name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-slate-950/80 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-cyan-400">
                      #{c.tracking_id}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        c.status === 'RESOLVED' ? 'bg-emerald-500 text-slate-950' :
                        c.status === 'IN_PROGRESS' ? 'bg-amber-500 text-slate-950' :
                        c.status === 'REOPENED' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        {c.category_name}
                      </span>
                      <span className="text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 line-clamp-2">{c.description}</h3>
                    <div className="text-[11px] text-slate-400">📍 {c.address || `${c.lat}, ${c.lng}`}</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-red-400">{c.priority} Priority</span>
                  <button
                    onClick={() => setSelectedComplaint(c)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1 shadow"
                  >
                    Manage Complaint <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* COMPLAINT DETAIL & ACTION MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400">Complaint Action Center</span>
                <h2 className="text-xl font-bold text-white">#{selectedComplaint.tracking_id} - {selectedComplaint.category_name}</h2>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="p-2 text-slate-400 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-2">Original Citizen Photo Evidence</h4>
                <div className="rounded-2xl overflow-hidden border border-slate-800 h-52 bg-slate-950">
                  <img src={selectedComplaint.original_image_url} alt="Evidence" className="w-full h-full object-cover" />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-2">GPS Location Pinpoint</h4>
                <InteractiveMap complaints={[selectedComplaint]} height="h-52" defaultCenter={[selectedComplaint.lat, selectedComplaint.lng]} zoom={15} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-200">Description</div>
              <p className="text-slate-300">{selectedComplaint.description}</p>
              <div className="text-[10px] text-slate-400 mt-2">
                Reported by: {selectedComplaint.citizen_name || 'Citizen'} • Contact: {selectedComplaint.citizen_phone || 'Protected'}
              </div>
            </div>

            {/* ACTION WORKFLOW BUTTONS */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Update Workflow Status</div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleStatusUpdate(selectedComplaint.id, 'IN_PROGRESS')}
                  className="p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4" /> Start Work
                </button>

                <button
                  onClick={() => setShowResolveModal(true)}
                  className="p-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <Upload className="w-4 h-4" /> Upload After Photo & Resolve
                </button>

                <button
                  onClick={() => handleStatusUpdate(selectedComplaint.id, 'REJECTED')}
                  className="p-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-xs border border-red-500/30 flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Reject Invalid
                </button>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedComplaint.lat},${selectedComplaint.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" /> Open Directions
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RESOLUTION PHOTO UPLOAD MODAL */}
      {showResolveModal && selectedComplaint && (
        <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleResolveSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400">Resolution Proof Upload</span>
                <h3 className="text-lg font-bold text-white">Upload "After Fix" Photo Evidence</h3>
              </div>
              <button type="button" onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <CameraCapture
              onImageCaptured={(file, dataUrl) => {
                setResolutionFile(file);
                setResolutionDataUrl(dataUrl);
              }}
            />

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Official Resolution Remarks</label>
              <textarea
                rows={3}
                value={resolutionRemarks}
                onChange={(e) => setResolutionRemarks(e.target.value)}
                placeholder="Describe work completed (e.g. Pothole filled with cold asphalt mix and compacted...)"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingResolution}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg"
              >
                <Check className="w-4 h-4" /> Confirm & Mark RESOLVED
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
