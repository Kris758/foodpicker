import type { Coordinates } from "./types";

export type GeolocationStatus =
  | "idle"
  | "prompt"
  | "loading"
  | "granted"
  | "denied"
  | "error";

export interface GeolocationResult {
  coordinates: Coordinates;
  accuracyM?: number;
}

export function getCurrentPosition(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          coordinates: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          accuracyM: pos.coords.accuracy,
        });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
}

export function geolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return "Location access was denied. Try entering a ZIP code instead.";
    case 2:
      return "Your position could not be determined. Try again or use a ZIP code.";
    case 3:
      return "Location request timed out. Try again or use a ZIP code.";
    default:
      return "Could not read your location. Try a ZIP code.";
  }
}
