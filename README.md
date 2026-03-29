# Food Picker

A static, mobile-friendly **Food Picker** dashboard built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**. It helps you discover nearby food spots using the browser **Geolocation API** or a **US ZIP code** (via [Zippopotam](https://api.zippopotam.us/), no API key). It runs entirely as a static site—ideal for **GitHub Pages** with no Node backend in production.

## Features

- Polished landing flow: prompt for location, graceful fallback to ZIP
- Mock demo dataset or pluggable **API** / **Yelp proxy** modes (see below)
- Filters: cuisine keyword, minimum rating, price levels, open now
- Sorting: best overall, closest, top rated
- “Can’t decide?” random pick with scroll and highlight
- Favorites, recent ZIPs, grid/list views, dark mode (persisted locally)
- Skeleton loading, empty states, and clear errors

## Local setup

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Switching data mode (mock vs API vs Yelp proxy)

Configuration is driven by environment variables (see `.env.example`). **Do not put secret API keys in the frontend**—use a serverless proxy you control if you need Yelp or other private credentials.

| Variable | Purpose |
|----------|---------|
| `VITE_DATA_MODE` | `mock` (default), `api`, or `yelp-proxy` |
| `VITE_RESTAURANTS_API_URL` | Base URL for `api` mode (see response shape below) |
| `VITE_YELP_PROXY_URL` | Base URL for `yelp-proxy` mode (your serverless facade) |
| `VITE_API_AUTH_HEADER` | Optional header, e.g. `Authorization: Bearer <token>` if your proxy requires it (prefer cookies / server-side auth when possible) |

Example `.env.local`:

```env
VITE_DATA_MODE=mock
VITE_BASE_PATH=/
```

For a generic REST backend, set:

```env
VITE_DATA_MODE=api
VITE_RESTAURANTS_API_URL=https://your-api.example.com/restaurants
```

Your endpoint should accept query parameters: `lat`, `lng`, `radius` (miles), optional `cuisine`. Respond with **JSON**: either a raw array of restaurant objects or `{ "results": [ ... ] }`.

Each item should normalize to fields compatible with `src/lib/dataProvider.ts` (`id`, `name`, `category`, `rating`, `reviewCount`, `price` / `priceLevel` (1–4), `distance` (optional), `address`, `imageUrl`, `isOpen`, `url`, `lat`/`lng` or `latitude`/`longitude`). Unknown shapes are skipped.

### Connecting a Yelp proxy later

1. Implement a **serverless** or small backend route that holds the **Yelp API key** (or OAuth) **only on the server**.
2. That route should accept safe query parameters (`lat`, `lng`, `radius`, `term`, etc.), call Yelp, then return JSON in the same normalized shape as above (array or `{ results: [] }`).
3. Set:

```env
VITE_DATA_MODE=yelp-proxy
VITE_YELP_PROXY_URL=https://your-worker.example.com/yelp-search
```

The UI and `fetchRestaurants()` in `src/lib/dataProvider.ts` already route through this adapter—no UI refactor required.

## Deploying to GitHub Pages

### 1. Base path

GitHub Project Pages URLs look like `https://<user>.github.io/<repo>/`. Vite must know the repo segment.

**Option A — `.env.production` in the repo** (replace `foodpicker` if your repo name differs):

```env
VITE_BASE_PATH=/foodpicker/
VITE_DATA_MODE=mock
```

**Option B — GitHub Actions**  
This repo includes `.github/workflows/deploy-pages.yml`, which sets:

`VITE_BASE_PATH=/${{ github.event.repository.name }}/`

so the base path tracks the repository name automatically.

### 2. Enable Pages

1. Repository **Settings → Pages**.
2. **Build and deployment**: source **GitHub Actions** (recommended with the included workflow), or deploy the `dist` folder from another pipeline.

### 3. Build output

The project uses a standard Vite static build:

```bash
npm run build
```

Output is in `dist/`. For manual upload, publish `dist` as the Pages artifact/root.

### 4. SPA routing

The app is a single page (`index.html` + client bundle). No client-side router is required, so there are no extra rewrite rules for GitHub Pages.

## Project structure (high level)

| Path | Role |
|------|------|
| `src/App.tsx` | Dashboard layout, data loading, filters, favorites |
| `src/components/LocationPrompt.tsx` | Location permission CTA |
| `src/components/ZipSearch.tsx` | ZIP search + recent ZIPs + cuisine quick picks |
| `src/components/FilterBar.tsx` | Filters and sort |
| `src/components/RestaurantCard.tsx` | Card / list row |
| `src/components/RandomPickButton.tsx` | Random suggestion |
| `src/components/FavoritesPanel.tsx` | Saved spots |
| `src/lib/types.ts` | Shared TypeScript types |
| `src/lib/config.ts` | Env-driven app config |
| `src/lib/dataProvider.ts` | Mock / API / Yelp-proxy providers |
| `src/lib/mockData.ts` | Demo restaurants |
| `src/lib/location.ts` | Geolocation helpers |
| `src/lib/geocode.ts` | ZIP → coordinates |
| `src/lib/utils.ts` | `cn`, haversine distance, maps URL, storage helpers |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Preview the production build locally |

## License

MIT (or your choice—this template has no license file by default).
