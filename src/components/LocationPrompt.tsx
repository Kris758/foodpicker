import { Loader2, MapPin, Navigation } from "lucide-react";
import { Button } from "./ui/button";

interface LocationPromptProps {
  onUseLocation: () => void;
  onEnterZip: () => void;
  loading?: boolean;
  error?: string | null;
  compact?: boolean;
}

export function LocationPrompt({
  onUseLocation,
  onEnterZip,
  loading,
  error,
  compact,
}: LocationPromptProps) {
  return (
    <div
      className={`rounded-2xl border border-border/80 bg-card p-6 shadow-lg shadow-black/5 transition-all duration-300 dark:shadow-black/20 ${
        compact ? "p-4" : "p-6 sm:p-8"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MapPin className="h-7 w-7" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Find food near you
            </h2>
            <p className="mt-1 text-sm text-muted-foreground text-balance">
              Allow location access for the best nearby picks, or search by ZIP
              code — your choice.
            </p>
          </div>
          {error ? (
            <p
              className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={onUseLocation}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Navigation className="h-4 w-4" aria-hidden />
              )}
              Use my location
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onEnterZip}
              disabled={loading}
              type="button"
            >
              Enter ZIP code
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
