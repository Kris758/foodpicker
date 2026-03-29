export type DataMode = "osm" | "mock" | "api" | "yelp-proxy";

function parseDataMode(value: string | undefined): DataMode {
  if (value === "mock" || value === "api" || value === "yelp-proxy") return value;
  if (value === "osm" || value === undefined || value === "") return "osm";
  return "osm";
}

export const appConfig = {
  dataMode: parseDataMode(import.meta.env.VITE_DATA_MODE),
  restaurantsApiUrl: import.meta.env.VITE_RESTAURANTS_API_URL ?? "",
  yelpProxyUrl: import.meta.env.VITE_YELP_PROXY_URL ?? "",
  /** Optional header name:value for your proxy (e.g. Bearer from edge function) — prefer no secrets in frontend; use cookie/session on proxy instead. */
  apiAuthHeader: import.meta.env.VITE_API_AUTH_HEADER ?? "",
} as const;
