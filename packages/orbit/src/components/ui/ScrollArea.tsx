import * as RScroll from "@radix-ui/react-scroll-area";
import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/**
 * ScrollArea — custom-scrollbar scroll container on Radix (shadcn-style).
 *
 *   <ScrollArea className="h-72"> …contenu long… </ScrollArea>
 */

export const ScrollArea = forwardRef<
  React.ElementRef<typeof RScroll.Root>,
  React.ComponentPropsWithoutRef<typeof RScroll.Root>
>(({ className, children, ...props }, ref) => (
  <RScroll.Root ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
    <RScroll.Viewport className="size-full rounded-[inherit]">{children}</RScroll.Viewport>
    <ScrollBar />
    <RScroll.Corner />
  </RScroll.Root>
));
ScrollArea.displayName = RScroll.Root.displayName;

export const ScrollBar = forwardRef<
  React.ElementRef<typeof RScroll.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof RScroll.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <RScroll.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none p-0.5 transition-colors",
      orientation === "vertical" && "h-full w-2.5",
      orientation === "horizontal" && "h-2.5 flex-col",
      className,
    )}
    {...props}
  >
    <RScroll.ScrollAreaThumb className="relative flex-1 rounded-pill bg-line-strong hover:bg-faint" />
  </RScroll.ScrollAreaScrollbar>
));
ScrollBar.displayName = RScroll.ScrollAreaScrollbar.displayName;
