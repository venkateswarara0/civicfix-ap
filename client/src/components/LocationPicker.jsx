import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Navigation, CheckCircle2, AlertTriangle, Building2, RefreshCw } from 'lucide-react';
import L from 'leaflet';

// Fix default Leaflet icon marker URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Helper component to center map on marker updates
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { animate: true });
    }
  }, [center, map]);
  return null;
}

// Map Click Listener Component
function MapEvents({ onLocationSelected }) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function LocationPicker({ onLocationConfirmed, initialCoords = null }) {
  // Default to Vijayawada, AP coordinates if browser location is unavailable
  const [coords, setCoords] = useState(
    initialCoords || { lat: 16.4975, lng: 80.6552, accuracy: 5.0 }
  );
  const [address, setAddress] = useState('Detecting address...');
  const [responsibleAuthority, setResponsibleAuthority] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    if (!initialCoords) {
      requestGPSLocation();
    } else {
      lookupAuthorityAndAddress(initialCoords.lat, initialCoords.lng);
    }
  }, []);

  const requestGPSLocation = () => {
    setLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your device browser. You can click on the map to set location manually.');
      setLocating(false);
      lookupAuthorityAndAddress(coords.lat, coords.lng);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ? parseFloat(pos.coords.accuracy.toFixed(1)) : 5.0
        };
        setCoords(newCoords);
        setLocating(false);
        lookupAuthorityAndAddress(newCoords.lat, newCoords.lng, newCoords.accuracy);
      },
      (err) => {
        console.warn('GPS position error:', err);
        setLocationError('Could not auto-detect exact GPS location. Please tap on the map to set your location.');
        setLocating(false);
        lookupAuthorityAndAddress(coords.lat, coords.lng);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const lookupAuthorityAndAddress = async (lat, lng, accuracy = coords.accuracy) => {
    try {
      // 1. Fetch nearby Sachivalayam authority
      const authRes = await fetch(`/api/sachivalayams/nearby?lat=${lat}&lng=${lng}`);
      if (authRes.ok) {
        const authData = await authRes.json();
        setResponsibleAuthority(authData);
      }

      // 2. Fetch reverse geocode address
      setAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (AP Region)`);
      const geocodeRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`
      );
      if (geocodeRes.ok) {
        const data = await geocodeRes.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        }
      }

      // Notify parent
      onLocationConfirmed({
        lat,
        lng,
        accuracy,
        address: address,
        authority: responsibleAuthority
      });
    } catch (err) {
      console.warn('Address/Authority lookup error:', err);
    }
  };

  const handleMapPinSelect = (lat, lng) => {
    const updated = { lat, lng, accuracy: 2.0 };
    setCoords(updated);
    lookupAuthorityAndAddress(lat, lng, 2.0);
  };

  return (
    <div className="w-full space-y-4">
      {/* Location Status & Auto-Detect CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
            <Navigation className={`w-5 h-5 ${locating ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">GPS Location Captured</div>
            <div className="text-[11px] text-slate-400 font-mono">
              Lat: {coords.lat.toFixed(6)} | Lng: {coords.lng.toFixed(6)} (±{coords.accuracy}m)
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={requestGPSLocation}
          disabled={locating}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-400 border border-slate-700 flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
          {locating ? 'Locating...' : 'Recalibrate GPS'}
        </button>
      </div>

      {locationError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Interactive Map Picker */}
      <div className="relative h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={15}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap center={[coords.lat, coords.lng]} />
          <MapEvents onLocationSelected={handleMapPinSelect} />
          <Marker position={[coords.lat, coords.lng]} />
        </MapContainer>

        <div className="absolute bottom-2 left-2 right-2 bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 z-[400] flex items-center justify-between">
          <span className="truncate pr-2">📍 {address}</span>
          <span className="text-emerald-400 text-[10px] font-bold whitespace-nowrap bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Tap map to adjust pin
          </span>
        </div>
      </div>

      {/* Responsible Authority Banner */}
      {responsibleAuthority && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Assigned Local Authority</div>
            <div className="text-sm font-bold text-slate-100">{responsibleAuthority.sachivalayam_name}</div>
            <div className="text-[11px] text-slate-400">
              Jurisdiction: {responsibleAuthority.jurisdiction} • Dist: {responsibleAuthority.distance_km || 0.5} km away
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
