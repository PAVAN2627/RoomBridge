// Geocoding utilities using Google Maps API

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Get coordinates (latitude, longitude) from a location string
 * @param location - Location string (e.g., "Powai, Mumbai")
 * @param city - City name (e.g., "Mumbai")
 * @returns Coordinates object or null if geocoding fails
 */
export async function geocodeLocation(
  location: string,
  city: string
): Promise<Coordinates | null> {
  try {
    const address = `${location}, ${city}, India`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return {
        latitude: lat,
        longitude: lng,
      };
    }

    console.error("Geocoding failed:", data.status, data.error_message);
    return null;
  } catch (error) {
    console.error("Error geocoding location:", error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get user's current location using browser geolocation API
 * @returns Coordinates object or null if geolocation fails
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser");
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting current location:", error);
        resolve(null);
      }
    );
  });
}
