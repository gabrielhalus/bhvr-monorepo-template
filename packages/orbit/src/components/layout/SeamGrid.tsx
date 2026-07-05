import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/**
 * SeamGrid — the house "flat panes joined by a hairline" pattern: one framed,
 * rounded container whose children are divided by 1px seams (`gap-px bg-line`)
 * instead of floating apart. Collapses to a single column below the `at`
 * breakpoint, then splits into `cols`. For a fluid card grid use `AutoGrid`.
 */
type Breakpoint = "sm" | "md" | "lg";
type Cols = 2 | 3 | 4;

// Literal classes so Tailwind's scanner keeps them. Below the breakpoint the
// grid is a single column; at/above it splits into `cols`.
const splitAt: Record<Breakpoint, Record<Cols, string>> = {
  sm: { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" },
  md: { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" },
  lg: { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" },
};

export type SeamGridProps = {
  cols?: Cols;
  /** Viewport at which the panes split from a stack into columns. */
  at?: Breakpoint;
} & React.HTMLAttributes<HTMLDivElement>;

export const SeamGrid = forwardRef<HTMLDivElement, SeamGridProps>(
  ({ className, cols = 2, at = "lg", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "grid gap-px overflow-hidden rounded-lg border border-line bg-line",
        splitAt[at][cols],
        // For an asymmetric split, pass e.g. `lg:grid-cols-[1.6fr_1fr]` in className.
        className,
      )}
      {...props}
    />
  ),
);
SeamGrid.displayName = "SeamGrid";
