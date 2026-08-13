import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import L from 'leaflet';

// Create custom status SVG pin markers
const createCustomIcon = (status) => {
  let color = '#ef4444'; // default red
  if (status === 'IN_PROGRESS') color = '#f59e0b'; // orange
  if (status === 'ASSIGNED') color = '#a855f7'; // purple
  if (status === 'RESOLVED') color = '#22c55e'; // green
  if (status === 'REOPENED') color = '#ec4899'; // pink

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="30" height="42">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z" fill="${color}" stroke="#0f172a" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="#ffffff"/>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svg,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38]
  });
};

export default function InteractiveMap({ complaints = [], height = 'h-96', defaultCenter = [16.4975, 80.6552], zoom = 12 }) {
  return (
    <div className={`w-full ${height} rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative z-10`}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {complaints.map((c) => (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            icon={createCustomIcon(c.status)}
          >
            <Popup>
              <div className="w-56 space-y-2 p-1">
                {c.original_image_url && (
                  <img
                    src={c.original_image_url}
                    alt={c.category_name}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="uppercase text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">{c.category_name}</span>
                  <span className={`px-1.5 py-0.5 rounded ${
                    c.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {c.priority}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-100 line-clamp-2">{c.description}</div>
                <div className="text-[10px] text-slate-400">📍 {c.address || `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`}</div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-400 font-bold">Status: {c.status}</span>
                  <Link
                    to={`/complaints/${c.id}`}
                    className="text-[10px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    View <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
