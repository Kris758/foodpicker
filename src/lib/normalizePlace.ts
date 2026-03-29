import type { Coordinates, Restaurant } from "./types";
import { haversineMiles } from "./utils";
import type { OverpassElement } from "./overpass";

const TAG_KEYS = new Set([
  "amenity",
  "name",
  "cuisine",
  "brand",
  "takeaway",
  "delivery",
  "opening_hours",
  "wheelchair",
  "outdoor_seating",
  "phone",
  "website",
]);

function elementCoordinates(el: OverpassElement): Coordinates | null {
  if (el.type === "node" && typeof el.lat === "number" && typeof el.lon === "number") {
    return { lat: el.lat, lng: el.lon };
  }
  const c = el.center;
  if (c && typeof c.lat === "number" && typeof c.lon === "number") {
    return { lat: c.lat, lng: c.lon };
  }
  return null;
}

function buildAddress(tags: Record<string, string>): string {
  const house = tags["addr:housenumber"] ?? "";
  const street = tags["addr:street"] ?? "";
  const line1 = [house, street].filter(Boolean).join(" ").trim();
  const city = tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"] ?? "";
  const state = tags["addr:state"] ?? "";
  const postcode = tags["addr:postcode"] ?? "";
  const parts = [line1, [city, state].filter(Boolean).join(", "), postcode].filter(
    (p) => p && String(p).trim() !== ""
  );
  return parts.join(" · ") || "Address not listed";
}

function collectUsefulTags(tags: Record<string, string>): string[] {
  const out: string[] = [];
  for (const [key, value] of Object.entries(tags)) {
    if (!value || !key) continue;
    if (
      TAG_KEYS.has(key) ||
      key.startsWith("addr:") ||
      key.startsWith("contact:") ||
      key.startsWith("diet:")
    ) {
      out.push(`${key}=${value}`);
    }
    if (out.length >= 24) break;
  }
  return out;
}

function inferIsOpen(tags: Record<string, string>): boolean {
  const oh = tags.opening_hours;
  if (!oh) return true;
  const lower = oh.toLowerCase();
  if (lower.includes("24/7") || lower === "24 hours") return true;
  if (
    lower === "closed" ||
    lower === "off" ||
    /^mo-su\s+off$/i.test(oh.trim())
  ) {
    return false;
  }
  return true;
}

function listingUrl(tags: Record<string, string>): string | null {
  const w = tags.website ?? tags["contact:website"] ?? tags["contact:facebook"];
  if (!w || !w.trim()) return null;
  const u = w.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

/**
 * Map a single Overpass element into the app’s Restaurant model.
 */
export function normalizeOverpassToRestaurant(
  el: OverpassElement,
  origin: Coordinates
): Restaurant | null {
  const tags = el.tags ?? {};
  const coords = elementCoordinates(el);
  if (!coords) return null;

  const amenity = tags.amenity?.trim() || "food";
  const name =
    tags.name?.trim() ||
    tags.brand?.trim() ||
    `Unnamed ${amenity.replace(/_/g, " ")}`;

  const id = `${el.type}/${el.id}`;
  const distance = haversineMiles(origin, coords);

  return {
    id,
    name,
    category: amenity.replace(/_/g, " "),
    rating: 0,
    reviewCount: 0,
    price: null,
    distance,
    address: buildAddress(tags),
    imageUrl: "",
    isOpen: inferIsOpen(tags),
    url: listingUrl(tags),
    coordinates: coords,
    tags: collectUsefulTags(tags),
    source: "openstreetmap",
  };
}

export function normalizeOverpassResults(
  elements: OverpassElement[],
  origin: Coordinates,
  maxResults: number
): Restaurant[] {
  const seen = new Set<string>();
  const list: Restaurant[] = [];

  for (const el of elements) {
    const r = normalizeOverpassToRestaurant(el, origin);
    if (!r || seen.has(r.id)) continue;
    seen.add(r.id);
    list.push(r);
  }

  list.sort((a, b) => a.distance - b.distance);
  return list.slice(0, Math.max(1, maxResults));
}
