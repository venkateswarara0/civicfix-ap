import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Upload, Check, AlertCircle, Image as ImageIcon, X } from 'lucide-react';

export default function CameraCapture({ onImageCaptured, initialImage = null }) {
  const [stream, setStream] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(initialImage);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access denied or unavailable. You can upload a photo from your gallery instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to compressed data URL / File
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Convert dataURL to File object for form upload
    fetch(dataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `captured-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setCapturedPreview(dataUrl);
        stopCamera();
        onImageCaptured(file, dataUrl);
      });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedPreview(reader.result);
        stopCamera();
        onImageCaptured(file, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    onImageCaptured(null, null);
  };

  return (
    <div className="w-full">
      {/* Hidden Canvas for Video Snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Case 1: Image Already Captured or Provided */}
      {capturedPreview ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-slate-900 group shadow-xl">
          <img
            src={capturedPreview}
            alt="Problem Evidence"
            className="w-full h-64 sm:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end justify-between p-4">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs bg-slate-900/90 px-3 py-1.5 rounded-full border border-emerald-500/30">
              <Check className="w-4 h-4" /> Photo Captured & Verified
            </div>
            <button
              type="button"
              onClick={handleRetake}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retake Photo
            </button>
          </div>
        </div>
      ) : cameraActive ? (
        /* Case 2: Live WebRTC Camera Stream */
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 sm:h-80 object-cover"
          />
          {/* Overlay Grid */}
          <div className="absolute inset-0 border-2 border-dashed border-emerald-500/30 rounded-2xl pointer-events-none"></div>

          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 px-4">
            <button
              type="button"
              onClick={stopCamera}
              className="p-3 rounded-full bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={capturePhoto}
              className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition transform hover:scale-105"
            >
              <Camera className="w-5 h-5" /> Take Photo Now
            </button>
          </div>
        </div>
      ) : (
        /* Case 3: Initial Camera Request & Gallery Option */
        <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center bg-slate-900/60 hover:border-slate-600 transition">
          {cameraError && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-slate-100 mb-1">Take a photo of the problem</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
            Clear visual evidence helps local Grama/Ward Sachivalayam officials inspect and resolve your complaint quickly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={startCamera}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              <Camera className="w-4 h-4" /> Open Camera
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition"
            >
              <Upload className="w-4 h-4 text-cyan-400" /> Upload from Gallery
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
