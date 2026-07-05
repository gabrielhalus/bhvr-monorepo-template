import * as RTooltip from "@radix-ui/react-tooltip";
import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/**
 * Tooltip — composable on Radix (shadcn-style).
 *
 *   <Tooltip>
 *     <TooltipTrigger asChild><Button …/></TooltipTrigger>
 *     <TooltipContent>Lier une note</TooltipContent>
 *   </Tooltip>
 *
 * A single `TooltipProvider` is included per `Tooltip` for convenience; wrap a
 * subtree in `TooltipProvider` directly to share delay/skip config.
 */

export const TooltipProvider = RTooltip.Provider;
export const TooltipTrigger = RTooltip.Trigger;

export function Tooltip({
  delayDuration = 150,
  ...props
}: React.ComponentPropsWithoutRef<typeof RTooltip.Root> & { delayDuration?: number }) {
  return (
    <RTooltip.Provider delayDuration={delayDuration}>
      <RTooltip.Root {...props} />
    </RTooltip.Provider>
  );
}

export const TooltipContent = forwardRef<
  React.ElementRef<typeof RTooltip.Content>,
  React.ComponentPropsWithoutRef<typeof RTooltip.Content>
>(({ className, sideOffset = 6, children, ...props }, ref) => (
  <RTooltip.Portal>
    <RTooltip.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 rounded-md bg-ink px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wide text-paper shadow-raised",
        className,
      )}
      {...props}
    >
      {children}
      <RTooltip.Arrow className="fill-ink" />
    </RTooltip.Content>
  </RTooltip.Portal>
));
TooltipContent.displayName = RTooltip.Content.displayName;
