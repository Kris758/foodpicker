import { Heart } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { RestaurantCard } from "./RestaurantCard";

interface FavoritesPanelProps {
  favorites: Restaurant[];
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  view: "grid" | "list";
}

export function FavoritesPanel({
  favorites,
  favoriteIds,
  onToggleFavorite,
  view,
}: FavoritesPanelProps) {
  if (favorites.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border/80 bg-muted/30 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Heart className="h-7 w-7" aria-hidden />
        </div>
        <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
          No favorites yet
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground text-balance">
          Tap the heart on any spot to save it here. Favorites stay on this
          device.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 fill-primary text-primary" aria-hidden />
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Favorites
        </h2>
        <span className="text-sm text-muted-foreground">
          ({favorites.length})
        </span>
      </div>
      <div
        className={
          view === "grid"
            ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            : "flex flex-col gap-3"
        }
      >
        {favorites.map((r) => (
          <RestaurantCard
            key={r.id}
            restaurant={r}
            variant={view === "grid" ? "grid" : "list"}
            isFavorite={favoriteIds.has(r.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}
