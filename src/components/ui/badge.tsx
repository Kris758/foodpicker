import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "outline" | "success" | "muted";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        {
          default:
            "border-transparent bg-primary/15 text-primary dark:bg-primary/25",
          secondary:
            "border-transparent bg-secondary text-secondary-foreground",
          outline: "border-border text-foreground",
          success:
            "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
          muted: "border-transparent bg-muted text-muted-foreground",
        }[variant],
        className
      )}
      {...props}
    />
  );
}
