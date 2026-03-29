import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Coordinates } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EARTH_MI = 3959;

export function haversineMiles(a: Coordinates, b: Coordinates): number {
  const dLat = deg2rad(b.lat - a.lat);
  const dLng = deg2rad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(a.lat)) *
      Math.cos(deg2rad(b.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return Math.round(EARTH_MI * c * 10) / 10;
}

function deg2rad(d: number) {
  return d * (Math.PI / 180);
}

export function googleMapsUrl(coords: Coordinates, label?: string): string {
  const q = label
    ? encodeURIComponent(`${label} @ ${coords.lat},${coords.lng}`)
    : `${coords.lat},${coords.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function storageSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}
