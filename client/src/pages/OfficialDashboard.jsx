import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import InteractiveMap from '../components/InteractiveMap';
import { 
  Building2, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Play, 
  XCircle, 
  Sparkles,
  Filter,
  Search,
  Check,
  ChevronRight
} from 'lucide-react';

export default function OfficialDashboard() {
  const { user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [resolutionFile, setResolutionFile] = useState(null);
  const [resolutionPreview, setResolutionPreview] = useState(null);
  const [submittingResolve, setSubmittingResolve] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    fetchOfficialComplaints();
  }, [user]);

  const fetchOfficialComplaints = async () => {
    setLoading(true);
    try {
      const sachId = user?.sachivalayam_id || '';
      const res = await fetch(`/api/complaints?sachivalayam_id=${sachId}`);
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
    setActionError(null);
    setActionSuccess(null);
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
          remarks: `Status updated to ${newStatus} by Sachivalayam official.`
        })
      });

      if (res.ok) {
        setActionSuccess(`Complaint status successfully updated to ${newStatus}`);
        fetchOfficialComplaints();
        if (selectedComplaint && selectedComplaint.id === complaintId) {
          setSelectedComplaint(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to update status');
      }
    } catch (err) {
      setActionError('Network error updating complaint status.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResolutionFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolutionPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionFile && !resolutionPreview) {
      setActionError('Photo evidence of resolution is required before marking as RESOLVED!');
      return;
    }

    setSubmittingResolve(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const token = localStorage.getItem('civicfix_token');
      const formData = new FormData();
      if (resolutionFile) {
        formData.append('resolution_image', resolutionFile);
      } else if (resolutionPreview) {
        formData.append('resolution_image_url', resolutionPreview);
      }

      formData.append('remarks', resolutionRemarks || 'Issue inspected on ground and resolved satisfactorily.');

      const res = await fetch(`/api/complaints/${selectedComplaint.id}/resolve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess('🎉 Complaint successfully marked RESOLVED with proof of work!');
        setShowResolveModal(false);
        setResolutionFile(null);
        setResolutionPreview(null);
        setResolutionRemarks('');
        fetchOfficialComplaints();
        setSelectedComplaint(null);
      } else {
        setActionError(data.error || 'Failed to resolve complaint');
      }
    } catch (err) {
      setActionError('Network error uploading resolution evidence.');
    } finally {
      setSubmittingResolve(false);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (filterStatus === 'ALL') return true;
    return c.status === filterStatus;
  });

  const getDirectionsUrl = (comp) => {
    if (!comp) return '#';
    let lat = comp.lat;
    let lng = comp.lng;
    if (lat > 50 && lng < 50) {
      const temp = lat;
      lat = lng;
      lng = temp;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Officer Dashboard Bar */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white">Sachivalayam Official Workbench</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] uppercase font-bold border border-amber-500/30">
                  AP Official
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged in as <strong className="text-slate-200">{user?.name}</strong> • Assigned Jurisdiction:{' '}
                <span className="text-emerald-400 font-bold">{user?.sachivalayam_id ? 'Patamata / Gudivada Ward Sachivalayam' : 'AP Central Portal'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Assigned Pending</div>
              <div className="text-lg font-black text-amber-400">
                {complaints.filter(c => c.status !== 'RESOLVED').length}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Total Solved</div>
              <div className="text-lg font-black text-emerald-400">
                {complaints.filter(c => c.status === 'RESOLVED').length}
              </div>
            </div>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['ALL', 'SUBMITTED', 'IN_PROGRESS', 'REOPENED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs whitespace-nowrap transition ${
                filterStatus === st
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Assigned Issues' : st}
            </button>
          ))}
        </div>

        {/* Complaints Grid & Drawer View */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs">Loading assigned Sachivalayam complaints...</div>
        ) : filteredComplaints.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">No complaints found for filter: {filterStatus}</h3>
            <p className="text-xs text-slate-400">All local civic issues under your jurisdiction are up to date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredComplaints.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedComplaint(c)}
                className="glass-card p-5 rounded-3xl border border-slate-800 hover:border-emerald-500/50 cursor-pointer space-y-4 transition-all group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-[11px]">
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
                  <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-emerald-400 transition">
                    {c.description}
                  </h3>
                </div>

                <div className="h-36 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 relative">
                  <img
                    src={c.original_image_url}
                    alt={c.category_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{c.address || `${c.lat}, ${c.lng}`}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Citizen: {c.citizen_name || 'Ravi Kumar'}</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <button className="w-full py-2.5 rounded-xl bg-slate-900 group-hover:bg-emerald-500 group-hover:text-slate-950 font-extrabold text-xs text-slate-300 flex items-center justify-center gap-1.5 transition">
                  Review & Action <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* SELECTED COMPLAINT DETAIL & ACTION MODAL */}
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-cyan-400">#{selectedComplaint.tracking_id}</span>
                  <h2 className="text-lg font-bold text-white">{selectedComplaint.category_name}</h2>
                </div>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                {selectedComplaint.description}
              </p>

              {/* Photo Evidence */}
              {selectedComplaint.resolution_image_url ? (
                <BeforeAfterSlider
                  beforeImage={selectedComplaint.original_image_url}
                  afterImage={selectedComplaint.resolution_image_url}
                />
              ) : (
                <div className="h-56 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img src={selectedComplaint.original_image_url} alt="Evidence" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Location Map Preview */}
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-400">Problem Location Pin</div>
                <div className="text-xs text-slate-300">📍 {selectedComplaint.address || `${selectedComplaint.lat}, ${selectedComplaint.lng}`}</div>
                <InteractiveMap complaints={[selectedComplaint]} height="h-44" defaultCenter={[selectedComplaint.lat, selectedComplaint.lng]} zoom={16} />
              </div>

              {/* Officer Action Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
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
                  href={getDirectionsUrl(selectedComplaint)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" /> Open Directions
                </a>
              </div>
            </div>

          </div>
        )}

        {/* RESOLUTION PHOTO UPLOAD MODAL */}
        {showResolveModal && selectedComplaint && (
          <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <form onSubmit={handleResolveSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-400" /> Upload Resolution Photo (Proof of Work)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Take/Upload After Photo Evidence *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:text-slate-950 file:font-bold"
                />

                {resolutionPreview && (
                  <div className="h-40 rounded-xl overflow-hidden border border-emerald-500/30">
                    <img src={resolutionPreview} alt="Proof preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Resolution Work Remarks</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Pothole filled with cold asphalt, road level inspected and confirmed by Sachivalayam engineer."
                  value={resolutionRemarks}
                  onChange={(e) => setResolutionRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingResolve}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg"
                >
                  {submittingResolve ? 'Uploading & Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
