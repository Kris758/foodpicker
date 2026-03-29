import {
  LayoutGrid,
  List,
  MapPin,
  Moon,
  Settings2,
  Sun,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { appConfig } from "./lib/config";
import { STORAGE_FAVORITES, STORAGE_THEME, STORAGE_VIEW } from "./lib/constants";
import { fetchRestaurants } from "./lib/dataProvider";
import { geocodeZip } from "./lib/geocode";
import {
  geolocationErrorMessage,
  getCurrentPosition,
} from "./lib/location";
import type {
  Coordinates,
  Restaurant,
  SearchFilters,
  SortMode,
} from "./lib/types";
import { storageGet, storageSet } from "./lib/utils";
import { FavoritesPanel } from "./components/FavoritesPanel";
import { FilterBar } from "./components/FilterBar";
import { LocationPrompt } from "./components/LocationPrompt";
import { RandomPickButton } from "./components/RandomPickButton";
import { RestaurantCard } from "./components/RestaurantCard";
import { RestaurantSkeletonGrid } from "./components/RestaurantSkeleton";
import { ZipSearch } from "./components/ZipSearch";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";

const defaultFilters: SearchFilters = {
  cuisine: "",
  minRating: 0,
  priceLevels: [],
  openNow: false,
};

function useDebounced<T>(value: T, ms: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return d;
}

function applyFilters(list: Restaurant[], f: SearchFilters): Restaurant[] {
  return list.filter((r) => {
    if (f.openNow && !r.isOpen) return false;
    if (f.minRating > 0 && r.rating < f.minRating) return false;
    if (f.priceLevels.length > 0) {
      if (r.price == null || !f.priceLevels.includes(r.price)) return false;
    }
    if (f.cuisine.trim()) {
      const q = f.cuisine.trim().toLowerCase();
      if (
        !r.category.toLowerCase().includes(q) &&
        !r.name.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
}

function sortList(list: Restaurant[], sort: SortMode): Restaurant[] {
  const copy = [...list];
  if (sort === "closest") {
    copy.sort((a, b) => a.distance - b.distance);
  } else if (sort === "topRated") {
    copy.sort((a, b) => b.rating - a.rating);
  } else {
    copy.sort((a, b) => {
      const sa = a.rating * Math.log10(a.reviewCount + 10);
      const sb = b.rating * Math.log10(b.reviewCount + 10);
      return sb - sa;
    });
  }
  return copy;
}

export default function App() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [showZipArea, setShowZipArea] = useState(false);

  const [raw, setRaw] = useState<Restaurant[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [sort, setSort] = useState<SortMode>("best");
  const [view, setView] = useState<"grid" | "list">(() =>
    storageGet(STORAGE_VIEW, "grid")
  );
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    const arr = storageGet<string[]>(STORAGE_FAVORITES, []);
    return new Set(arr);
  });
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedCuisine = useDebounced(filters.cuisine, 450);

  const persistFavorites = useCallback((next: Set<string>) => {
    storageSet(STORAGE_FAVORITES, [...next]);
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        persistFavorites(next);
        return next;
      });
    },
    [persistFavorites]
  );

  useEffect(() => {
    storageSet(STORAGE_VIEW, view);
  }, [view]);

  useEffect(() => {
    const t = storageGet<"light" | "dark">(STORAGE_THEME, "light");
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  const toggleTheme = () => {
    const dark = document.documentElement.classList.toggle("dark");
    storageSet(STORAGE_THEME, dark ? "dark" : "light");
  };

  const cuisineForApi =
    appConfig.dataMode !== "mock" ? debouncedCuisine.trim() || undefined : undefined;

  useEffect(() => {
    if (!coords) return;
    const ac = new AbortController();
    setFetchLoading(true);
    setFetchError(null);
    fetchRestaurants({
      coordinates: coords,
      cuisine: cuisineForApi,
      radiusMiles: 12,
      signal: ac.signal,
    })
      .then((data) => {
        if (!ac.signal.aborted) setRaw(data);
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        const msg =
          e instanceof Error ? e.message : "Could not load restaurants.";
        setFetchError(msg);
        setRaw([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setFetchLoading(false);
      });
    return () => ac.abort();
  }, [coords, cuisineForApi]);

  const filtered = useMemo(
    () => sortList(applyFilters(raw, filters), sort),
    [raw, filters, sort]
  );

  const favoritesList = useMemo(() => {
    return raw.filter((r) => favoriteIds.has(r.id));
  }, [raw, favoriteIds]);

  const handleUseLocation = async () => {
    setGeoError(null);
    setGeoLoading(true);
    try {
      const { coordinates } = await getCurrentPosition();
      setCoords(coordinates);
      setLocationLabel("Your location");
      setShowZipArea(false);
    } catch (e: unknown) {
      let code = 0;
      if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        typeof (e as { code?: number }).code === "number"
      ) {
        code = (e as { code: number }).code;
      }
      setGeoError(geolocationErrorMessage(code));
      setShowZipArea(true);
    } finally {
      setGeoLoading(false);
    }
  };

  const handleZipSubmit = async (zip: string) => {
    setZipLoading(true);
    setFetchError(null);
    try {
      const c = await geocodeZip(zip);
      if (!c) throw new Error("ZIP not found");
      setCoords(c);
      setLocationLabel(`ZIP ${zip.slice(0, 5)}`);
      setGeoError(null);
    } finally {
      setZipLoading(false);
    }
  };

  const randomPick = () => {
    if (filtered.length === 0) return;
    const i = Math.floor(Math.random() * filtered.length);
    const id = filtered[i].id;
    setHighlightId(id);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlightId(null), 2800);
    document.getElementById(`card-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const dataModeLabel =
    appConfig.dataMode === "mock"
      ? "Demo data"
      : appConfig.dataMode === "api"
        ? "API"
        : "Yelp proxy";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <MapPin className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-none tracking-tight">
                Food Picker
              </p>
              <p className="text-xs text-muted-foreground">Nearby eats</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">
              {dataModeLabel}
            </Badge>
            <div className="flex rounded-lg border border-border bg-card p-0.5">
              <Button
                type="button"
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={view === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView("list")}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:inline" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <section className="space-y-6">
          <div className="max-w-2xl space-y-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Discover great food around you
            </h1>
            <p className="text-muted-foreground text-balance sm:text-lg">
              Location-aware picks, smart filters, and a little chaos when you
              need it — all running in your browser.
            </p>
          </div>

          {!coords ? (
            <LocationPrompt
              onUseLocation={handleUseLocation}
              onEnterZip={() => setShowZipArea(true)}
              loading={geoLoading}
              error={geoError}
            />
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Searching near
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {locationLabel ?? "Selected place"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseLocation}
                  disabled={geoLoading}
                >
                  Update location
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowZipArea(true)}
                >
                  Use ZIP
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCoords(null);
                    setLocationLabel(null);
                    setRaw([]);
                    setShowZipArea(true);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          )}

          {(showZipArea || !coords) && (
            <ZipSearch
              onSubmitZip={handleZipSubmit}
              loading={zipLoading}
              disabled={false}
              onCuisinePick={(c) =>
                setFilters((f) => ({ ...f, cuisine: c }))
              }
              cuisineActive={filters.cuisine}
            />
          )}
        </section>

        {coords && (
          <>
            <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Settings2 className="h-4 w-4" />
                <span className="text-sm">Tune results</span>
              </div>
              <RandomPickButton
                onPick={randomPick}
                disabled={fetchLoading}
                count={filtered.length}
              />
            </section>

            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              sort={sort}
              onSortChange={setSort}
              resultCount={filtered.length}
            />

            {fetchError ? (
              <div
                className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center"
                role="alert"
              >
                <p className="font-medium text-red-700 dark:text-red-400">
                  {fetchError}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Check your connection or switch to demo mode in config.
                </p>
              </div>
            ) : null}

            {fetchLoading ? (
              <RestaurantSkeletonGrid count={6} />
            ) : !fetchError && filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-12 text-center">
                <p className="font-display text-lg font-semibold text-foreground">
                  No matches
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground text-balance">
                  Try widening filters, turning off &quot;Open now&quot;, or
                  searching a different cuisine keyword.
                </p>
              </div>
            ) : (
              <div
                className={
                  view === "grid"
                    ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    : "flex flex-col gap-3"
                }
              >
                {filtered.map((r) => (
                  <div key={r.id} id={`card-${r.id}`}>
                    <RestaurantCard
                      restaurant={r}
                      variant={view === "grid" ? "grid" : "list"}
                      isFavorite={favoriteIds.has(r.id)}
                      onToggleFavorite={toggleFavorite}
                      highlight={highlightId === r.id}
                    />
                  </div>
                ))}
              </div>
            )}

            <FavoritesPanel
              favorites={favoritesList}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              view={view}
            />
          </>
        )}
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        <p>
          Food Picker · Static demo-friendly app · Maps open in Google Maps
        </p>
      </footer>
    </div>
  );
}
