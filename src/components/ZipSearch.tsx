import { Clock, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { POPULAR_CUISINES, STORAGE_RECENT_ZIPS } from "@/lib/constants";
import { isLikelyUsZip } from "@/lib/geocode";
import { storageGet, storageSet } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const MAX_RECENT = 6;

interface ZipSearchProps {
  onSubmitZip: (zip: string) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  onCuisinePick?: (cuisine: string) => void;
  cuisineActive?: string;
}

export function ZipSearch({
  onSubmitZip,
  loading,
  disabled,
  onCuisinePick,
  cuisineActive,
}: ZipSearchProps) {
  const [zip, setZip] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(() =>
    storageGet(STORAGE_RECENT_ZIPS, [] as string[])
  );

  const pushRecent = (z: string) => {
    const next = [z, ...recent.filter((x) => x !== z)].slice(0, MAX_RECENT);
    setRecent(next);
    storageSet(STORAGE_RECENT_ZIPS, next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const t = zip.trim();
    if (!isLikelyUsZip(t)) {
      setLocalError("Enter a valid US ZIP (e.g. 60601 or 60601-1234).");
      return;
    }
    try {
      await onSubmitZip(t);
      pushRecent(t.slice(0, 5));
    } catch {
      setLocalError("Could not look up that ZIP. Try another.");
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur-sm sm:p-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="ZIP code"
            className="h-11 pl-9"
            disabled={disabled || loading}
            inputMode="numeric"
            autoComplete="postal-code"
            aria-label="ZIP code"
          />
        </div>
        <Button
          type="submit"
          className="h-11 shrink-0 sm:min-w-[120px]"
          disabled={disabled || loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </form>
      {localError ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {localError}
        </p>
      ) : null}
      {recent.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Recent
          </span>
          {recent.map((z) => (
            <button
              key={z}
              type="button"
              className="rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary"
              onClick={() => {
                setZip(z);
                void onSubmitZip(z).then(() => pushRecent(z));
              }}
            >
              {z}
            </button>
          ))}
        </div>
      ) : null}
      {onCuisinePick ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Popular cuisines
          </p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_CUISINES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCuisinePick(c)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all duration-200 ${
                  cuisineActive?.toLowerCase() === c
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
