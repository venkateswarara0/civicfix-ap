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
 * Finds the responsible Sachivalayam for given GPS coordinates.
 * Priority:
 * 1. Jurisdiction bounding box match (min_lat <= lat <= max_lat AND min_lng <= lng <= max_lng)
 * 2. Nearest distance within max radius (e.g. 25km)
 * 3. Fallback to default central Sachivalayam or return null (for admin assignment)
 */
export async function findResponsibleSachivalayam(latitude, longitude) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    return {
      sachivalayam_id: null,
      sachivalayam_name: 'Unassigned (Pending Admin Review)',
      assigned_official_id: null,
      distance_km: null,
      assignment_method: 'MANUAL_REQUIRED',
      jurisdiction: 'Invalid Coordinates'
    };
  }

  const sachivalayams = await dbAll('SELECT * FROM sachivalayams');

  if (!sachivalayams || sachivalayams.length === 0) {
    return {
      sachivalayam_id: null,
      sachivalayam_name: 'Unassigned (No Sachivalayam Registered)',
      assigned_official_id: null,
      distance_km: null,
      assignment_method: 'MANUAL_REQUIRED',
      jurisdiction: 'None'
    };
  }

  // 1. Try Geofence / Bounding Box Match
  for (const s of sachivalayams) {
    if (s.min_lat && s.max_lat && s.min_lng && s.max_lng) {
      if (
        lat >= s.min_lat &&
        lat <= s.max_lat &&
        lng >= s.min_lng &&
        lng <= s.max_lng
      ) {
        const dist = calculateHaversineDistance(lat, lng, s.lat, s.lng);
        // Find assigned official for this Sachivalayam if available
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

  // 2. Fallback to Nearest Sachivalayam by Haversine Distance
  let nearest = null;
  let minDistance = Infinity;

  for (const s of sachivalayams) {
    const dist = calculateHaversineDistance(lat, lng, s.lat, s.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = s;
    }
  }

  if (nearest && minDistance <= 30) { // Within 30 km radius
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

  // 3. Fallback to default Sachivalayam or Admin Manual Review
  const defaultSachivalayam = sachivalayams[0];
  const official = await dbGet(
    "SELECT id FROM users WHERE role = 'OFFICIAL' AND sachivalayam_id = ? LIMIT 1",
    [defaultSachivalayam.id]
  );
  const dist = calculateHaversineDistance(lat, lng, defaultSachivalayam.lat, defaultSachivalayam.lng);

  return {
    sachivalayam_id: defaultSachivalayam.id,
    sachivalayam_name: defaultSachivalayam.name,
    sachivalayam_code: defaultSachivalayam.code,
    assigned_official_id: official ? official.id : null,
    distance_km: parseFloat(dist.toFixed(2)),
    assignment_method: 'FALLBACK_DEFAULT',
    jurisdiction: `${defaultSachivalayam.village}, ${defaultSachivalayam.mandal}`
  };
}
