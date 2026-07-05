import type { Align, Gap, Justify } from "./_flex";

import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

import { aligns, gaps, justifies } from "./_flex";

/**
 * Stack — vertical flexbox layout. The everyday "space things out in a column"
 * box; replaces ad-hoc `flex flex-col gap-…` markup. For a horizontal, wrapping
 * row use `Cluster`.
 */
export type StackProps = {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ className, gap = "md", align, justify, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        className={cn(
          "flex min-w-0 flex-col",
          gaps[gap],
          align && aligns[align],
          justify && justifies[justify],
          className,
        )}
        {...props}
      />
    );
  },
);
Stack.displayName = "Stack";
