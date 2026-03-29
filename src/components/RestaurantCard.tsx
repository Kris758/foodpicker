import { ExternalLink, Heart, MapPin, Star } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { cn, googleMapsUrl } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface RestaurantCardProps {
  restaurant: Restaurant;
  variant?: "grid" | "list";
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  highlight?: boolean;
}

export function RestaurantCard({
  restaurant: r,
  variant = "grid",
  isFavorite,
  onToggleFavorite,
  highlight,
}: RestaurantCardProps) {
  const mapsHref = googleMapsUrl(r.coordinates, r.name);
  const priceLabel =
    r.price != null ? "$".repeat(r.price) : "—";

  if (variant === "list") {
    return (
      <article
        className={cn(
          "group flex animate-fade-in gap-4 rounded-xl border border-border/80 bg-card p-3 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md",
          highlight && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-28 sm:w-28">
          {r.imageUrl ? (
            <img
              src={r.imageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-semibold leading-tight text-foreground">
                {r.name}
              </h3>
              {onToggleFavorite ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-primary"
                  aria-label={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                  onClick={() => onToggleFavorite(r.id)}
                >
                  <Heart
                    className={cn(
                      "h-5 w-5",
                      isFavorite && "fill-primary text-primary"
                    )}
                  />
                </Button>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{r.category}</Badge>
              <span>{priceLabel}</span>
              <span>·</span>
              <span>{r.distance} mi</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Rating rating={r.rating} count={r.reviewCount} />
            <OpenBadge open={r.isOpen} />
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              href={mapsHref}
              target="_blank"
            >
              <MapPin className="h-3.5 w-3.5" />
              Maps
            </Button>
            {r.url ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                href={r.url}
                target="_blank"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Site
              </Button>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group flex animate-fade-in flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5",
        highlight && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {r.imageUrl ? (
          <img
            src={r.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <OpenBadge open={r.isOpen} className="backdrop-blur-sm" />
        </div>
        {onToggleFavorite ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-3 top-3 h-9 w-9 rounded-full bg-background/90 shadow-md backdrop-blur-sm"
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            onClick={() => onToggleFavorite(r.id)}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                isFavorite && "fill-primary text-primary"
              )}
            />
          </Button>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-lg font-semibold leading-snug text-foreground">
            {r.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {r.address}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{r.category}</Badge>
          <span className="text-sm text-muted-foreground">{priceLabel}</span>
          <span className="text-sm text-muted-foreground">
            · {r.distance} mi
          </span>
        </div>
        <Rating rating={r.rating} count={r.reviewCount} />
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <Button
            variant="default"
            size="sm"
            className="flex-1 sm:flex-none"
            href={mapsHref}
            target="_blank"
          >
            <MapPin className="h-4 w-4" />
            Open in Maps
          </Button>
          {r.url ? (
            <Button variant="outline" size="sm" href={r.url} target="_blank">
              <ExternalLink className="h-4 w-4" />
              Listing
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Rating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
      <span className="text-muted-foreground">({count})</span>
    </div>
  );
}

function OpenBadge({
  open,
  className,
}: {
  open: boolean;
  className?: string;
}) {
  return (
    <Badge variant={open ? "success" : "muted"} className={className}>
      {open ? "Open" : "Closed"}
    </Badge>
  );
}
