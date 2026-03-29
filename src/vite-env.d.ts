/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_MODE: "osm" | "mock" | "api" | "yelp-proxy";
  readonly VITE_BASE_PATH: string;
  readonly VITE_RESTAURANTS_API_URL: string;
  readonly VITE_YELP_PROXY_URL: string;
  readonly VITE_API_AUTH_HEADER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
