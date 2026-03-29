import type { Coordinates } from "./types";

const ZIP_US = /^\d{5}(-\d{4})?$/;

type NominatimHit = { lat?: string; lon?: string };

/**
 * Geocode a US ZIP using Nominatim (OpenStreetMap).
 * @see https://nominatim.org/release-docs/latest/api/Search/
 */
export async function geocodeZip(zip: string): Promise<Coordinates | null> {
  const trimmed = zip.trim();
  if (!ZIP_US.test(trimmed)) return null;
  const five = trimmed.slice(0, 5);
  const params = new URLSearchParams({
    postalcode: five,
    country: "USA",
    format: "json",
    limit: "1",
  });
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as NominatimHit[];
  if (!Array.isArray(data) || data.length === 0) return null;
  const hit = data[0];
  if (!hit?.lat || !hit?.lon) return null;
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

export function isLikelyUsZip(input: string): boolean {
  return ZIP_US.test(input.trim());
}
