import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CameraCapture from '../components/CameraCapture';
import LocationPicker from '../components/LocationPicker';
import { 
  Camera, 
  MapPin, 
  Grid, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  ThumbsUp, 
  Sparkles,
  Loader2
} from 'lucide-react';

const CATEGORIES = [
  { id: 'pothole', name: 'Pothole', icon: '🕳️', desc: 'Road crater, cracked asphalt' },
  { id: 'road', name: 'Road Damage', icon: '🛣️', desc: 'Broken street, cave-in' },
  { id: 'garbage', name: 'Garbage Dumping', icon: '🗑️', desc: 'Overflowing bin, open waste' },
  { id: 'open_manhole', name: 'Open Manhole', icon: '🚧', desc: 'Dangerous uncovered drain' },
  { id: 'streetlight', name: 'Street Light', icon: '💡', desc: 'Dark / broken lamp pole' },
  { id: 'water_leak', name: 'Water Leakage', icon: '🚰', desc: 'Leaking pipe, water waste' },
  { id: 'drainage', name: 'Drainage Overflow', icon: '🌧️', desc: 'Blocked sewer line' },
  { id: 'fallen_tree', name: 'Fallen Tree', icon: '🌳', desc: 'Blocked road or wire' },
  { id: 'traffic', name: 'Traffic / Signboard', icon: '🚦', desc: 'Broken signal or sign' },
  { id: 'damaged_property', name: 'Public Property', icon: '🏗️', desc: 'Damaged bench, fence' },
  { id: 'sanitation', name: 'Sanitation Issue', icon: '🏠', desc: 'Public hygiene concern' },
  { id: 'electrical', name: 'Electrical Wire', icon: '⚡', desc: 'Hanging power line' }
];

export default function ReportWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleImageCaptured = (file, dataUrl) => {
    setPhotoFile(file);
    setPhotoDataUrl(dataUrl);
  };

  const handleLocationConfirmed = (loc) => {
    setLocationData(loc);
  };

  // Check duplicate complaints nearby when location and category are chosen
  const checkDuplicates = async () => {
    if (!locationData || !selectedCategory) {
      setStep(4);
      return;
    }

    try {
      const res = await fetch(
        `/api/complaints/nearby?lat=${locationData.lat}&lng=${locationData.lng}&category_id=${selectedCategory}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.duplicates && data.duplicates.length > 0) {
          setDuplicates(data.duplicates);
          setShowDuplicateModal(true);
        } else {
          setStep(4); // proceed to description
        }
      } else {
        setStep(4);
      }
    } catch (err) {
      setStep(4);
    }
  };

  const handleUpvoteExisting = async (complaintId) => {
    try {
      const token = localStorage.getItem('civicfix_token');
      const res = await fetch(`/api/complaints/${complaintId}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        navigate('/track');
      }
    } catch (err) {
      console.error('Upvote error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoFile && !photoDataUrl) {
      setErrorMessage('Please capture or upload a photo of the problem.');
      return;
    }
    if (!locationData) {
      setErrorMessage('Location coordinates are required.');
      return;
    }
    if (!selectedCategory) {
      setErrorMessage('Please select an issue category.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      if (photoFile) {
        formData.append('image', photoFile);
      } else if (photoDataUrl) {
        formData.append('image_url', photoDataUrl);
      }

      formData.append('category_id', selectedCategory);
      formData.append('description', description || `${selectedCategory} reported via CivicFix portal.`);
      formData.append('lat', locationData.lat || 16.442);
      formData.append('lng', locationData.lng || 81.002);
      formData.append('location_accuracy', locationData.accuracy || 5.0);
      formData.append('custom_address', locationData.address || 'Gudivada Town, Krishna District, AP');

      const token = localStorage.getItem('civicfix_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setSubmittedComplaint(data);
        setStep(5); // Success step
      } else {
        setErrorMessage(data.error || 'Failed to submit complaint');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMessage('Network error submitting complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Direct Sachivalayam Issue Portal
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">Report a Civic Problem</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Submit photo evidence & GPS coordinates to notify your local Grama/Ward Sachivalayam.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        {step < 5 && (
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            {[
              { num: 1, label: 'Camera', icon: Camera },
              { num: 2, label: 'Location', icon: MapPin },
              { num: 3, label: 'Category', icon: Grid },
              { num: 4, label: 'Details', icon: FileText }
            ].map((s) => {
              const active = step === s.num;
              const done = step > s.num;

              return (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                      done
                        ? 'bg-emerald-500 text-slate-950'
                        : active
                        ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                  </div>
                  <span className={`hidden sm:inline text-xs font-bold ${active ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: CAMERA */}
        {step === 1 && (
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" /> Step 1: Capture Photo of Problem
              </h2>
              <p className="text-xs text-slate-400">Take a clear photo showing the issue location and severity.</p>
            </div>

            <CameraCapture onImageCaptured={handleImageCaptured} initialImage={photoDataUrl} />

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                disabled={!photoDataUrl}
                onClick={() => setStep(2)}
                className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                  photoDataUrl
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Next: GPS Location <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION & AUTHORITY */}
        {step === 2 && (
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" /> Step 2: Confirm Problem Location
              </h2>
              <p className="text-xs text-slate-400">GPS automatically pinpoints your coordinates to identify your responsible Sachivalayam.</p>
            </div>

            <LocationPicker onLocationConfirmed={handleLocationConfirmed} />

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Camera
              </button>

              <button
                type="button"
                disabled={!locationData}
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg"
              >
                Next: Select Category <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CATEGORY */}
        {step === 3 && (
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Grid className="w-5 h-5 text-amber-400" /> Step 3: Select Issue Category
              </h2>
              <p className="text-xs text-slate-400">Choose the category that best describes this civic problem.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <div>
                    <div className="text-xs font-bold text-white">{cat.name}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">{cat.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Location
              </button>

              <button
                type="button"
                disabled={!selectedCategory}
                onClick={checkDuplicates}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg"
              >
                Next: Description <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: DESCRIPTION & SUBMIT */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" /> Step 4: Describe the Issue & Submit
              </h2>
              <p className="text-xs text-slate-400">Add optional details to help Sachivalayam staff locate and resolve it faster.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Issue Description / Landmarks</label>
              <textarea
                rows={4}
                placeholder="e.g. Deep pothole near Bommuluru junction main road, dangerous for bikes at night..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Summary Review Card */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
              <div className="font-bold text-slate-300 border-b border-slate-800 pb-1">Report Summary</div>
              <div className="flex justify-between text-slate-400">
                <span>Category:</span>
                <strong className="text-amber-400">
                  {CATEGORIES.find(c => c.id === selectedCategory)?.name || selectedCategory}
                </strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Location:</span>
                <strong className="text-slate-200 text-right truncate max-w-[200px]">
                  {locationData?.address || `${locationData?.lat}, ${locationData?.lng}`}
                </strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Authority:</span>
                <strong className="text-emerald-400">
                  {locationData?.authority?.sachivalayam_name || 'Gudivada Municipal Ward Sachivalayam 05'}
                </strong>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-emerald-500/20 transition transform hover:scale-105"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting Report...
                  </>
                ) : (
                  <>
                    Submit Official Report <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: SUCCESS CONFIRMATION */}
        {step === 5 && submittedComplaint && (
          <div className="glass-card p-8 rounded-3xl border border-emerald-500/30 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Complaint Submitted Successfully!</h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Your report has been received and routed to your local Grama/Ward Sachivalayam.
              </p>
            </div>

            {/* Tracking ID Badge - Safe Property Resolution */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 max-w-sm mx-auto space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Tracking Reference ID</div>
              <div className="text-xl font-mono font-black text-emerald-400">
                {submittedComplaint.tracking_id || submittedComplaint.complaint?.tracking_id || 'CF-2026-SUCCESS'}
              </div>
              <div className="text-[11px] text-slate-400">
                Assigned: {submittedComplaint.assigned_sachivalayam?.sachivalayam_name || 'Gudivada Municipal Ward Sachivalayam 05'}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                to={`/complaints/${submittedComplaint.complaint_id || submittedComplaint.complaint?.id || 1}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                Track Live Status <ArrowRight className="w-4 h-4" />
              </Link>
              
              <button
                onClick={() => {
                  setStep(1);
                  setPhotoFile(null);
                  setPhotoDataUrl(null);
                  setSelectedCategory('');
                  setDescription('');
                  setSubmittedComplaint(null);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700"
              >
                Report Another Problem
              </button>
            </div>
          </div>
        )}

      </div>

      {/* DUPLICATE COMPLAINT WARNING MODAL */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Similar Issue Reported Nearby</h3>
                <p className="text-xs text-slate-400">A similar complaint already exists within ~150 meters.</p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {duplicates.map((dup) => (
                <div key={dup.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-400">📍 {dup.distance_meters} meters away</span>
                    <span className="text-slate-400">{dup.status}</span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{dup.description}</p>
                  
                  <button
                    type="button"
                    onClick={() => handleUpvoteExisting(dup.id)}
                    className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-amber-500/30"
                  >
                    <ThumbsUp className="w-4 h-4" /> Support & Upvote Existing Issue (+1)
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDuplicateModal(false);
                  setStep(4);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Report as New Problem Anyway
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
