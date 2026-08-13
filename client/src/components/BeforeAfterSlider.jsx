import React, { useState } from 'react';
import { SlidersHorizontal, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function BeforeAfterSlider({ beforeImage, afterImage, height = 'h-72 sm:h-96' }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX, rect) => {
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.touches[0].clientX, rect);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.clientX, rect);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
        <div className="flex items-center gap-1.5 text-amber-400">
          <ShieldAlert className="w-4 h-4" /> BEFORE (Reported Problem)
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-4 h-4" /> AFTER (Official Resolution Proof)
        </div>
      </div>

      <div
        className={`relative ${height} w-full rounded-2xl overflow-hidden select-none cursor-ew-resize border border-slate-800 shadow-2xl bg-slate-950`}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* AFTER IMAGE (Base Layer) */}
        <img
          src={afterImage || beforeImage}
          alt="After Resolution"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 bg-emerald-500/90 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
          AFTER FIXING
        </div>

        {/* BEFORE IMAGE (Clipped Layer) */}
        <div
          className="absolute inset-0 overflow-hidden border-r-2 border-emerald-400 shadow-2xl"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt="Before Reporting"
            className="absolute inset-0 w-full h-full object-cover max-w-none"
            style={{ width: '100%', height: '100%' }}
          />
          <div className="absolute top-3 left-3 bg-amber-500/90 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
            BEFORE (ORIGINAL)
          </div>
        </div>

        {/* DRAG HANDLE BAR */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-teal-300 to-emerald-500 shadow-2xl flex items-center justify-center pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-emerald-400 shadow-2xl flex items-center justify-center text-emerald-400 transform -translate-x-1/2">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-500 italic">
        👈 Drag slider left and right to inspect proof of resolution 👉
      </div>
    </div>
  );
}
