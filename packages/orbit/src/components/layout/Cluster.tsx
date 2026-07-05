import type { Align, Gap, Justify } from "./_flex";

import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

import { aligns, gaps, justifies } from "./_flex";

/**
 * Cluster — horizontal flexbox layout that **wraps**. For toolbars, action rows,
 * tag/badge lists — anything that should reflow onto the next line on narrow
 * screens. Pass `nowrap` to force a single line. For a vertical column use `Stack`.
 */
export type ClusterProps = {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  /** Disable wrapping (single-line row). */
  nowrap?: boolean;
  asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export const Cluster = forwardRef<HTMLDivElement, ClusterProps>(
  (
    { className, gap = "sm", align = "center", justify, nowrap = false, asChild = false, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        className={cn(
          "flex min-w-0 flex-row",
          nowrap ? "flex-nowrap" : "flex-wrap",
          gaps[gap],
          aligns[align],
          justify && justifies[justify],
          className,
        )}
        {...props}
      />
    );
  },
);
Cluster.displayName = "Cluster";
