import type { Gap } from "./_flex";

import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

import { gaps } from "./_flex";

/**
 * AutoGrid — a fluid grid that fits as many `min`-wide columns as the container
 * allows, then reflows to fewer columns. Intrinsically responsive: no
 * breakpoints to manage. Ideal for card / stat grids. For flat hairline-seamed
 * panes use `SeamGrid`.
 */
export type AutoGridProps = {
  /** Minimum column width in px before wrapping (the `minmax` floor). */
  min?: number;
  gap?: Gap;
} & React.HTMLAttributes<HTMLDivElement>;

export const AutoGrid = forwardRef<HTMLDivElement, AutoGridProps>(
  ({ className, min = 240, gap = "md", style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("grid", gaps[gap], className)}
      style={{
        // min(…,100%) prevents a single column from overflowing tiny viewports.
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`,
        ...style,
      }}
      {...props}
    />
  ),
);
AutoGrid.displayName = "AutoGrid";
