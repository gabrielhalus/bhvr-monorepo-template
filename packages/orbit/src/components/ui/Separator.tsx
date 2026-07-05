import * as RSeparator from "@radix-ui/react-separator";
import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/** Separator — hairline divider on Radix. `orientation`: horizontal (default) | vertical. */
export const Separator = forwardRef<
  React.ElementRef<typeof RSeparator.Root>,
  React.ComponentPropsWithoutRef<typeof RSeparator.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <RSeparator.Root
    ref={ref}
    orientation={orientation}
    decorative={decorative}
    className={cn(
      "shrink-0 bg-line",
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className,
    )}
    {...props}
  />
));
Separator.displayName = RSeparator.Root.displayName;
