import { Dices } from "lucide-react";
import { Button } from "./ui/button";

interface RandomPickButtonProps {
  onPick: () => void;
  disabled?: boolean;
  count: number;
}

export function RandomPickButton({
  onPick,
  disabled,
  count,
}: RandomPickButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full gap-2 rounded-xl border border-border/80 bg-gradient-to-r from-secondary to-accent/30 shadow-sm transition-all duration-300 hover:shadow-md sm:w-auto"
      onClick={onPick}
      disabled={disabled || count === 0}
    >
      <Dices className="h-5 w-5 text-primary" aria-hidden />
      Can&apos;t decide?
    </Button>
  );
}
