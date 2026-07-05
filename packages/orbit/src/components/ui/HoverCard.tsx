import * as RHover from "@radix-ui/react-hover-card";
import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/**
 * HoverCard — composable hover-triggered preview on Radix (shadcn-style).
 *
 *   <HoverCard>
 *     <HoverCardTrigger asChild><a>@acme</a></HoverCardTrigger>
 *     <HoverCardContent>…aperçu…</HoverCardContent>
 *   </HoverCard>
 */

export const HoverCard = RHover.Root;
export const HoverCardTrigger = RHover.Trigger;

export const HoverCardContent = forwardRef<
  React.ElementRef<typeof RHover.Content>,
  React.ComponentPropsWithoutRef<typeof RHover.Content>
>(({ className, align = "center", sideOffset = 8, ...props }, ref) => (
  <RHover.Portal>
    <RHover.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-64 rounded-xl border border-line bg-surface p-4 text-sm text-ink shadow-pop outline-none",
        "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
        className,
      )}
      {...props}
    />
  </RHover.Portal>
));
HoverCardContent.displayName = RHover.Content.displayName;
