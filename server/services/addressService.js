// Reverse geocoding helper service for resolving lat, lng into human readable AP addresses
export async function reverseGeocode(latitude, longitude) {
  try {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return 'Location coordinates unavailable';
    }

    // Try OpenStreetMap Nominatim with custom user-agent
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CivicFix-AP-CivicPlatform/1.0'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode fetch failed, using fallback formatter:', err.message);
  }

  // Fallback formatter based on known regional AP coordinates
  return `GPS Pin (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) - Andhra Pradesh, India`;
}
