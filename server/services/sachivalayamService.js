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
 * 1. Jurisdiction bounding box geofence match (min_lat <= lat <= max_lat AND min_lng <= lng <= max_lng)
 * 2. Nearest registered Sachivalayam distance
 * 3. Town/Mandal dynamic local authority assignment for AP locations
 */
export async function findResponsibleSachivalayam(latitude, longitude) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    return {
      sachivalayam_id: 6,
      sachivalayam_name: 'Gudivada Municipal Ward Sachivalayam 05',
      sachivalayam_code: 'AP-KRI-GDV-005',
      assigned_official_id: 5,
      distance_km: 0.1,
      assignment_method: 'DEFAULT',
      jurisdiction: 'Gudivada, Krishna District'
    };
  }

  const sachivalayams = await dbAll('SELECT * FROM sachivalayams');

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
        const official = await dbGet(
          "SELECT id FROM users WHERE role = 'OFFICIAL' AND sachivalayam_id = ? LIMIT 1",
          [s.id]
        );

        return {
          sachivalayam_id: s.id,
          sachivalayam_name: s.name,
          sachivalayam_code: s.code,
          assigned_official_id: official ? official.id : 5,
          distance_km: parseFloat(dist.toFixed(2)),
          assignment_method: 'JURISDICTION_MATCH',
          jurisdiction: `${s.village}, ${s.mandal}, ${s.district}`
        };
      }
    }
  }

  // 2. Nearest registered Sachivalayam by Haversine Distance
  let nearest = null;
  let minDistance = Infinity;

  for (const s of sachivalayams) {
    const dist = calculateHaversineDistance(lat, lng, s.lat, s.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = s;
    }
  }

  if (nearest && minDistance <= 15) {
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

  // 3. Special AP Regional Geofence Check for Gudivada (Lat ~16.35 - 16.48, Lng ~80.95 - 81.10)
  if (lat >= 16.30 && lat <= 16.55 && lng >= 80.90 && lng <= 81.15) {
    const gudivadaSach = sachivalayams.find(s => s.id === 6) || nearest;
    const dist = calculateHaversineDistance(lat, lng, 16.4181, 81.0170);

    return {
      sachivalayam_id: gudivadaSach.id,
      sachivalayam_name: 'Gudivada Municipal Ward Sachivalayam 05',
      sachivalayam_code: 'AP-KRI-GDV-005',
      assigned_official_id: 5,
      distance_km: parseFloat(dist.toFixed(2)),
      assignment_method: 'LOCAL_MUNICIPALITY_MATCH',
      jurisdiction: 'Bommuluru / Gudivada Town, Krishna District'
    };
  }

  // Fallback to closest available Sachivalayam
  return {
    sachivalayam_id: nearest ? nearest.id : 6,
    sachivalayam_name: nearest ? nearest.name : 'Gudivada Ward Sachivalayam 05',
    sachivalayam_code: nearest ? nearest.code : 'AP-KRI-GDV-005',
    assigned_official_id: 5,
    distance_km: parseFloat(minDistance.toFixed(2)),
    assignment_method: 'FALLBACK_CLOSEST',
    jurisdiction: `${nearest ? nearest.village : 'Gudivada'}, Krishna District`
  };
}
