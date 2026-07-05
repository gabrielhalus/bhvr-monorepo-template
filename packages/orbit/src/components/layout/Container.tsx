import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/**
 * Container — centers content and caps its width, with responsive gutters that
 * grow with the viewport (px-4 → sm:px-6 → lg:px-8). Use it to wrap a page so
 * content doesn't stretch edge-to-edge on wide screens.
 */

type Size = "sm" | "md" | "lg" | "xl" | "full";

const sizes: Record<Size, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
};

export type ContainerProps = {
  size?: Size;
  /** Drop the responsive horizontal gutters (when a parent already pads). */
  flush?: boolean;
  asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "xl", flush = false, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        className={cn(
          "mx-auto w-full",
          sizes[size],
          !flush && "px-4 sm:px-6 lg:px-8",
          className,
        )}
        {...props}
      />
    );
  },
);
Container.displayName = "Container";
