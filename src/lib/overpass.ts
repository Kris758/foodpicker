/**
 * Overpass API — nearby food-related amenities (OpenStreetMap).
 * Public instance; be respectful of load (single query per search).
 */

const OVERPASS_INTERPRETER = "https://overpass-api.de/api/interpreter";

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

function buildFoodAroundQuery(lat: number, lng: number, radiusMeters: number): string {
  const r = Math.max(200, Math.min(Math.round(radiusMeters), 25_000));
  return `[out:json][timeout:25];
(
  node["amenity"~"restaurant|cafe|fast_food|bar|pub|food_court"](around:${r},${lat},${lng});
  way["amenity"~"restaurant|cafe|fast_food|bar|pub|food_court"](around:${r},${lat},${lng});
  relation["amenity"~"restaurant|cafe|fast_food|bar|pub|food_court"](around:${r},${lat},${lng});
);
out center;`;
}

export async function fetchNearbyFoodFromOverpass(
  lat: number,
  lng: number,
  radiusMeters: number,
  signal?: AbortSignal
): Promise<OverpassElement[]> {
  const query = buildFoodAroundQuery(lat, lng, radiusMeters);
  const res = await fetch(OVERPASS_INTERPRETER, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: `data=${encodeURIComponent(query)}`,
    signal,
  });

  if (!res.ok) {
    throw new Error(
      `Could not load places from OpenStreetMap (Overpass returned ${res.status}). Try again in a moment.`
    );
  }

  const json = (await res.json()) as OverpassResponse;
  const elements = json.elements;
  if (!Array.isArray(elements)) return [];

  return elements.filter(
    (e) =>
      e &&
      (e.type === "node" || e.type === "way" || e.type === "relation") &&
      typeof e.id === "number"
  );
}
