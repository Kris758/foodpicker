import { appConfig } from "./config";
import { getMockRestaurantsNear } from "./mockData";
import { normalizeOverpassResults } from "./normalizePlace";
import { fetchNearbyFoodFromOverpass } from "./overpass";
import type { Coordinates, Restaurant } from "./types";
import { haversineMiles } from "./utils";

const OSM_MAX_RESULTS = 80;

export interface FetchRestaurantsOptions {
  coordinates: Coordinates;
  cuisine?: string;
  radiusMiles?: number;
  signal?: AbortSignal;
}

/**
 * Pluggable entry: osm (default) | mock | generic REST API | Yelp proxy.
 * API responses must be JSON arrays of normalized Restaurant objects (see README).
 */
export async function fetchRestaurants(
  opts: FetchRestaurantsOptions
): Promise<Restaurant[]> {
  const { coordinates, cuisine, radiusMiles = 8, signal } = opts;

  switch (appConfig.dataMode) {
    case "osm":
      return fetchOsm(coordinates, radiusMiles, signal);
    case "mock":
      return fetchMock(coordinates, cuisine, radiusMiles);
    case "api":
      return fetchApiMode(coordinates, cuisine, radiusMiles, signal);
    case "yelp-proxy":
      return fetchYelpProxy(coordinates, cuisine, radiusMiles, signal);
    default:
      return fetchOsm(coordinates, radiusMiles, signal);
  }
}

async function fetchOsm(
  coordinates: Coordinates,
  radiusMiles: number,
  signal?: AbortSignal
): Promise<Restaurant[]> {
  const radiusMeters = Math.min(
    Math.max(Math.round(radiusMiles * 1609.344), 800),
    25_000
  );
  const elements = await fetchNearbyFoodFromOverpass(
    coordinates.lat,
    coordinates.lng,
    radiusMeters,
    signal
  );
  return normalizeOverpassResults(elements, coordinates, OSM_MAX_RESULTS);
}

function fetchMock(
  coordinates: Coordinates,
  cuisine: string | undefined,
  radiusMiles: number
): Promise<Restaurant[]> {
  const list = getMockRestaurantsNear(coordinates).filter(
    (r) => r.distance <= radiusMiles
  );
  const filtered = cuisine
    ? list.filter(
        (r) =>
          r.category.toLowerCase().includes(cuisine.toLowerCase()) ||
          r.name.toLowerCase().includes(cuisine.toLowerCase())
      )
    : list;
  return Promise.resolve(filtered);
}

async function fetchApiMode(
  coordinates: Coordinates,
  cuisine: string | undefined,
  radiusMiles: number,
  signal?: AbortSignal
): Promise<Restaurant[]> {
  const base = appConfig.restaurantsApiUrl.replace(/\/$/, "");
  if (!base) {
    console.warn(
      "[Food Picker] VITE_RESTAURANTS_API_URL is empty; falling back to mock data."
    );
    return fetchMock(coordinates, cuisine, radiusMiles);
  }
  const params = new URLSearchParams({
    lat: String(coordinates.lat),
    lng: String(coordinates.lng),
    radius: String(radiusMiles),
  });
  if (cuisine) params.set("cuisine", cuisine);
  const headers: HeadersInit = { Accept: "application/json" };
  if (appConfig.apiAuthHeader) {
    const [name, ...rest] = appConfig.apiAuthHeader.split(":");
    const value = rest.join(":").trim();
    if (name && value) headers[name.trim()] = value;
  }
  const res = await fetch(`${base}?${params}`, { signal, headers });
  if (!res.ok) throw new Error(`Restaurant API error (${res.status})`);
  const raw = (await res.json()) as unknown;
  return normalizeApiPayload(raw, coordinates);
}

async function fetchYelpProxy(
  coordinates: Coordinates,
  cuisine: string | undefined,
  radiusMiles: number,
  signal?: AbortSignal
): Promise<Restaurant[]> {
  const base = appConfig.yelpProxyUrl.replace(/\/$/, "");
  if (!base) {
    console.warn(
      "[Food Picker] VITE_YELP_PROXY_URL is empty; falling back to mock data."
    );
    return fetchMock(coordinates, cuisine, radiusMiles);
  }
  const params = new URLSearchParams({
    lat: String(coordinates.lat),
    lng: String(coordinates.lng),
    radius: String(radiusMiles),
  });
  if (cuisine) params.set("term", cuisine);
  const res = await fetch(`${base}?${params}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Yelp proxy error (${res.status})`);
  const raw = (await res.json()) as unknown;
  return normalizeApiPayload(raw, coordinates);
}

function normalizeApiPayload(
  raw: unknown,
  origin: Coordinates
): Restaurant[] {
  const arr = Array.isArray(raw) ? raw : (raw as { results?: unknown })?.results;
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => normalizeOne(item, origin))
    .filter((r): r is Restaurant => r != null);
}

function normalizeOne(item: unknown, origin: Coordinates): Restaurant | null {
  if (!item || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;
  const id = String(o.id ?? o.businessId ?? "");
  const name = String(o.name ?? "");
  if (!id || !name) return null;
  const lat = num(o.lat ?? o.latitude);
  const lng = num(o.lng ?? o.longitude);
  const coordinates: Coordinates =
    lat != null && lng != null
      ? { lat, lng }
      : { lat: origin.lat, lng: origin.lng };
  const distance =
    num(o.distance) ?? haversineMiles(origin, coordinates);
  const categoryRaw = o.category ?? firstCategoryTitle(o.categories);
  return {
    id,
    name,
    category: String(categoryRaw || "Restaurant"),
    rating: num(o.rating) ?? 0,
    reviewCount: Math.round(num(o.reviewCount ?? o.review_count) ?? 0),
    price: normalizePrice(o.price ?? o.priceLevel),
    distance,
    address: String(o.address ?? o.location ?? ""),
    imageUrl: String(o.imageUrl ?? o.image_url ?? ""),
    isOpen: Boolean(o.isOpen ?? o.is_open ?? true),
    url: o.url != null ? String(o.url) : null,
    coordinates,
    source: "api",
  };
}

function num(v: unknown): number | null {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function firstCategoryTitle(categories: unknown): string {
  if (!Array.isArray(categories) || categories.length === 0) return "";
  const first = categories[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "title" in first) {
    const t = (first as { title?: unknown }).title;
    return typeof t === "string" ? t : "";
  }
  return "";
}

function normalizePrice(v: unknown): Restaurant["price"] {
  const n = num(v);
  if (n == null) return null;
  const r = Math.round(n);
  if (r >= 1 && r <= 4) return r as Restaurant["price"];
  return null;
}
