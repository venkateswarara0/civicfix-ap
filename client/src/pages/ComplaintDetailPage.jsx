import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import InteractiveMap from '../components/InteractiveMap';
import { 
  FileText, 
  MapPin, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ThumbsUp, 
  ThumbsDown, 
  ArrowLeft, 
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmFeedback, setConfirmFeedback] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState(null);

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const fetchComplaintDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/complaints/${id}`);
      if (res.ok) {
        const data = await res.json();
        setComplaint(data.complaint);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load complaint details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolutionConfirmation = async (confirmedSolved) => {
    setConfirming(true);
    setConfirmMessage(null);
    try {
      const token = localStorage.getItem('civicfix_token');
      const res = await fetch(`/api/complaints/${complaint.id}/confirm-resolution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          confirmed_solved: confirmedSolved,
          citizen_feedback: confirmFeedback
        })
      });

      const data = await res.json();
      if (res.ok) {
        setConfirmMessage({ type: 'success', text: data.message });
        fetchComplaintDetails();
      } else {
        setConfirmMessage({ type: 'error', text: data.error || 'Failed to process confirmation' });
      }
    } catch (err) {
      setConfirmMessage({ type: 'error', text: 'Network error processing confirmation.' });
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading complaint details...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <h2 className="text-xl font-bold text-white">Complaint Not Found</h2>
        <Link to="/track" className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl font-bold text-xs">
          Return to My Reports
        </Link>
      </div>
    );
  }

  const steps = [
    { label: 'Submitted', key: 'SUBMITTED' },
    { label: 'Assigned', key: 'ASSIGNED' },
    { label: 'In Progress', key: 'IN_PROGRESS' },
    { label: 'Resolved', key: 'RESOLVED' }
  ];

  const getStepStatus = (stepKey) => {
    if (complaint.status === 'REOPENED') return 'reopened';
    const statusOrder = ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];
    const currentIdx = statusOrder.indexOf(complaint.status);
    const stepIdx = statusOrder.indexOf(stepKey);

    if (currentIdx >= stepIdx) return 'completed';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/track"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Reports
          </Link>

          <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            #{complaint.tracking_id}
          </span>
        </div>

        {/* Complaint Main Card */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xs">
                  {complaint.category_name}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase ${
                  complaint.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300'
                }`}>
                  Priority: {complaint.priority}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{complaint.description}</h1>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider ${
                complaint.status === 'RESOLVED' ? 'bg-emerald-500 text-slate-950' :
                complaint.status === 'IN_PROGRESS' ? 'bg-amber-500 text-slate-950' :
                complaint.status === 'REOPENED' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
              }`}>
                Status: {complaint.status}
              </span>
            </div>
          </div>

          {/* BEFORE vs AFTER IMAGE SLIDER SECTION */}
          {complaint.resolution_image_url ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Resolution Visual Evidence (Before vs. After)
              </h3>
              <BeforeAfterSlider
                beforeImage={complaint.original_image_url}
                afterImage={complaint.resolution_image_url}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Citizen Reported Photo Evidence</h3>
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 max-h-96">
                <img
                  src={complaint.original_image_url}
                  alt={complaint.category_name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* CITIZEN CONFIRMATION ACTION BOX (Requirement #13) */}
          {complaint.status === 'RESOLVED' && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-2 border-emerald-500/40 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Was this problem actually solved?</h3>
                  <p className="text-xs text-slate-300">
                    Sachivalayam officer has marked this issue RESOLVED. Please verify on ground and confirm.
                  </p>
                </div>
              </div>

              {confirmMessage && (
                <div className={`p-3 rounded-xl text-xs ${
                  confirmMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400'
                }`}>
                  {confirmMessage.text}
                </div>
              )}

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Optional citizen feedback notes..."
                  value={confirmFeedback}
                  onChange={(e) => setConfirmFeedback(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                />

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => handleResolutionConfirmation(true)}
                    disabled={confirming}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg"
                  >
                    <ThumbsUp className="w-4 h-4" /> YES, SOLVED SATISFACTORILY
                  </button>

                  <button
                    onClick={() => handleResolutionConfirmation(false)}
                    disabled={confirming}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <ThumbsDown className="w-4 h-4" /> NO, STILL A PROBLEM (REOPEN)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TIMELINE PROGRESS STEPPER */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" /> Resolution Lifecycle History
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {steps.map((st, idx) => {
                const statusState = getStepStatus(st.key);
                return (
                  <div
                    key={st.key}
                    className={`p-3 rounded-xl border text-center transition ${
                      statusState === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : statusState === 'reopened'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold tracking-wider mb-1">Step {idx + 1}</div>
                    <div className="text-xs font-extrabold">{st.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Activity Logs */}
            <div className="space-y-2 pt-2">
              {history.map((h) => (
                <div key={h.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-200">{h.changed_by_name || 'System'} → {h.new_status}</div>
                    <p className="text-slate-400 mt-0.5">{h.remarks}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">{new Date(h.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* LOCATION MAP & SACHIVALAYAM INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exact Location</h4>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span>📍 {complaint.address || `${complaint.lat}, ${complaint.lng}`}</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${complaint.lat},${complaint.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-bold shrink-0"
                >
                  Open Map <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <InteractiveMap complaints={[complaint]} height="h-48" defaultCenter={[complaint.lat, complaint.lng]} zoom={15} />
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Responsible Sachivalayam</h4>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-base text-emerald-400">{complaint.sachivalayam_name}</div>
                <div className="text-slate-400">Jurisdiction: {complaint.village}, {complaint.mandal}, {complaint.district}</div>
                <div className="text-slate-400">Contact Officer: <strong className="text-slate-200">{complaint.sachivalayam_contact_person || 'Ward Secretary'}</strong></div>
                <div className="text-slate-400">Official Helpline: <strong className="text-slate-200">{complaint.sachivalayam_phone || '+91 98480 12345'}</strong></div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
