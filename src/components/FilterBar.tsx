import { SlidersHorizontal } from "lucide-react";
import type { PriceLevel, SearchFilters, SortMode } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const PRICE: PriceLevel[] = [1, 2, 3, 4];

interface FilterBarProps {
  filters: SearchFilters;
  onFiltersChange: (f: SearchFilters) => void;
  sort: SortMode;
  onSortChange: (s: SortMode) => void;
  resultCount: number;
}

export function FilterBar({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  resultCount,
}: FilterBarProps) {
  const togglePrice = (p: PriceLevel) => {
    const has = filters.priceLevels.includes(p);
    onFiltersChange({
      ...filters,
      priceLevels: has
        ? filters.priceLevels.filter((x) => x !== p)
        : [...filters.priceLevels, p].sort(),
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span>Filters</span>
          <span className="text-muted-foreground font-normal">
            · {resultCount} place{resultCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["best", "Best overall"],
              ["closest", "Closest"],
              ["topRated", "Top rated"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              variant={sort === key ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => onSortChange(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Cuisine keyword
          </label>
          <Input
            placeholder="e.g. pizza, tacos…"
            value={filters.cuisine}
            onChange={(e) =>
              onFiltersChange({ ...filters, cuisine: e.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Min rating
          </label>
          <Input
            type="number"
            min={0}
            max={5}
            step={0.5}
            value={filters.minRating || ""}
            placeholder="0"
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onFiltersChange({
                ...filters,
                minRating: Number.isNaN(v) ? 0 : Math.min(5, Math.max(0, v)),
              });
            }}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Price
          </label>
          <div className="flex flex-wrap gap-2">
            {PRICE.map((p) => (
              <Button
                key={p}
                type="button"
                size="sm"
                variant={
                  filters.priceLevels.includes(p) ? "default" : "outline"
                }
                className="rounded-full px-3"
                onClick={() => togglePrice(p)}
              >
                {"$".repeat(p)}
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => onFiltersChange({ ...filters, priceLevels: [] })}
            >
              Clear price
            </Button>
          </div>
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
          checked={filters.openNow}
          onChange={(e) =>
            onFiltersChange({ ...filters, openNow: e.target.checked })
          }
        />
        <span>Open now only</span>
      </label>
    </div>
  );
}
