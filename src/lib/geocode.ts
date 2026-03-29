import type { Coordinates } from "./types";

const ZIP_US = /^\d{5}(-\d{4})?$/;

/**
 * Geocode a US ZIP using Zippopotam (no API key; public JSON).
 * Returns null if invalid or lookup fails.
 */
export async function geocodeZip(zip: string): Promise<Coordinates | null> {
  const trimmed = zip.trim();
  if (!ZIP_US.test(trimmed)) return null;
  const five = trimmed.slice(0, 5);
  const res = await fetch(`https://api.zippopotam.us/us/${five}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    places?: Array<{ latitude?: string; longitude?: string }>;
  };
  const p = data.places?.[0];
  if (!p?.latitude || !p?.longitude) return null;
  const lat = Number(p.latitude);
  const lng = Number(p.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

export function isLikelyUsZip(input: string): boolean {
  return ZIP_US.test(input.trim());
}
