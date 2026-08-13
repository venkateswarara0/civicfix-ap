import { dbAll, dbGet } from '../db.js';

// Haversine formula to compute distance in kilometers between two GPS points
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
}

/**
 * Pure Real-Time GPS Routing Engine for AP Sachivalayams
 * Finds the nearest Sachivalayam registered by an actual Sachivalayam Head.
 */
export async function findResponsibleSachivalayam(latitude, longitude) {
  let lat = parseFloat(latitude);
  let lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    lat = 16.442;
    lng = 81.002;
  }

  // Auto-correct if lat and lng are flipped (lat > 50° is Longitude in India!)
  if (lat > 50 && lng < 50) {
    const temp = lat;
    lat = lng;
    lng = temp;
  }

  const sachivalayams = await dbAll('SELECT * FROM sachivalayams');

  if (!sachivalayams || sachivalayams.length === 0) {
    return {
      sachivalayam_id: null,
      sachivalayam_name: 'Awaiting Local Sachivalayam Head Registration',
      sachivalayam_code: 'AP-PORTAL',
      assigned_official_id: null,
      distance_km: 0,
      assignment_method: 'PENDING_REGISTRATION',
      jurisdiction: 'Andhra Pradesh Grama & Ward Sachivalayam Direct Connect'
    };
  }

  // 1. Try Exact Jurisdiction Bounding Box Match
  for (const s of sachivalayams) {
    if (s.min_lat && s.max_lat && s.min_lng && s.max_lng) {
      if (
        lat >= s.min_lat &&
        lat <= s.max_lat &&
        lng >= s.min_lng &&
        lng <= s.max_lng
      ) {
        const dist = calculateHaversineDistance(lat, lng, s.lat, s.lng);
        const official = await dbGet(
          "SELECT id FROM users WHERE role = 'OFFICIAL' AND sachivalayam_id = ? LIMIT 1",
          [s.id]
        );

        return {
          sachivalayam_id: s.id,
          sachivalayam_name: s.name,
          sachivalayam_code: s.code,
          assigned_official_id: official ? official.id : null,
          distance_km: parseFloat(dist.toFixed(2)),
          assignment_method: 'JURISDICTION_MATCH',
          jurisdiction: `${s.village}, ${s.mandal}, ${s.district}`
        };
      }
    }
  }

  // 2. Pure Nearest Distance Matching to Registered Sachivalayams
  let nearest = null;
  let minDistance = Infinity;

  for (const s of sachivalayams) {
    const dist = calculateHaversineDistance(lat, lng, s.lat, s.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = s;
    }
  }

  // Only assign if the nearest registered Sachivalayam is within reasonable local distance (<= 50 km)
  if (nearest && minDistance <= 50) {
    const official = await dbGet(
      "SELECT id FROM users WHERE role = 'OFFICIAL' AND sachivalayam_id = ? LIMIT 1",
      [nearest.id]
    );

    return {
      sachivalayam_id: nearest.id,
      sachivalayam_name: nearest.name,
      sachivalayam_code: nearest.code,
      assigned_official_id: official ? official.id : null,
      distance_km: parseFloat(minDistance.toFixed(2)),
      assignment_method: 'NEAREST_DISTANCE',
      jurisdiction: `${nearest.village}, ${nearest.mandal}, ${nearest.district}`
    };
  }

  // If no Sachivalayam has been registered in this area yet
  return {
    sachivalayam_id: null,
    sachivalayam_name: 'Awaiting Local Sachivalayam Registration',
    sachivalayam_code: 'AP-PENDING',
    assigned_official_id: null,
    distance_km: parseFloat(minDistance.toFixed(2)),
    assignment_method: 'PENDING_LOCAL_OFFICIAL',
    jurisdiction: 'AP Grama & Ward Sachivalayam Portal'
  };
}
