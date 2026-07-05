import * as RPopover from "@radix-ui/react-popover";
import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/**
 * Popover — composable floating panel on Radix (shadcn-style).
 *
 *   <Popover>
 *     <PopoverTrigger asChild><Button variant="outline">Filtres</Button></PopoverTrigger>
 *     <PopoverContent>…</PopoverContent>
 *   </Popover>
 */

export const Popover = RPopover.Root;
export const PopoverTrigger = RPopover.Trigger;
export const PopoverAnchor = RPopover.Anchor;
export const PopoverClose = RPopover.Close;

export const PopoverContent = forwardRef<
  React.ElementRef<typeof RPopover.Content>,
  React.ComponentPropsWithoutRef<typeof RPopover.Content>
>(({ className, align = "center", sideOffset = 8, ...props }, ref) => (
  <RPopover.Portal>
    <RPopover.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-xl border border-line bg-surface p-4 text-sm text-ink shadow-pop outline-none",
        "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
        className,
      )}
      {...props}
    />
  </RPopover.Portal>
));
PopoverContent.displayName = RPopover.Content.displayName;
