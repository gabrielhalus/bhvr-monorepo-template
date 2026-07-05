import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/**
 * Timeline — composable vertical activity feed.
 *
 *   <Timeline>
 *     <TimelineItem tone="accent" icon={<Check />}>
 *       <TimelineHeader>
 *         <TimelineTitle>Maquette validée</TimelineTitle>
 *         <TimelineTime>2h</TimelineTime>
 *       </TimelineHeader>
 *       <TimelineDescription>par Amanda Cole</TimelineDescription>
 *     </TimelineItem>
 *   </Timeline>
 *
 * The connector line is drawn automatically and hidden on the last item.
 */

type Tone = "accent" | "amber" | "coral" | "sage" | "sky" | "ink";

const dotTones: Record<Tone, string> = {
  accent: "bg-accent border-accent-deep/50",
  amber: "bg-amber border-amber-deep/50",
  coral: "bg-coral border-coral-deep/50",
  sage: "bg-sage border-sage-deep/50",
  sky: "bg-sky border-sky/60",
  ink: "bg-ink border-ink",
};

export const Timeline = forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<"ol">>(
  ({ className, ...props }, ref) => (
    <ol ref={ref} className={cn("relative space-y-6", className)} {...props} />
  ),
);
Timeline.displayName = "Timeline";

export const TimelineItem = forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li"> & { tone?: Tone; icon?: React.ReactNode }
>(({ className, tone = "ink", icon, children, ...props }, ref) => (
  <li
    ref={ref}
    className={cn(
      "relative flex gap-4 pl-1 [&:last-child>[data-timeline-connector]]:hidden",
      className,
    )}
    {...props}
  >
    <span
      data-timeline-connector
      aria-hidden
      className="absolute left-2.5 top-6 h-[calc(100%+0.25rem)] w-px bg-line"
    />
    <span
      aria-hidden
      className={cn(
        "relative z-10 mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2",
        dotTones[tone],
      )}
    >
      {icon && <span className="text-ink [&>svg]:size-3">{icon}</span>}
    </span>
    <div className="min-w-0 flex-1 pb-1">{children}</div>
  </li>
));
TimelineItem.displayName = "TimelineItem";

export const TimelineHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-baseline justify-between gap-3", className)} {...props} />
  ),
);
TimelineHeader.displayName = "TimelineHeader";

export const TimelineTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm font-medium text-ink", className)} {...props} />
  ),
);
TimelineTitle.displayName = "TimelineTitle";

export const TimelineTime = forwardRef<HTMLTimeElement, React.ComponentPropsWithoutRef<"time">>(
  ({ className, ...props }, ref) => (
    <time
      ref={ref}
      className={cn(
        "shrink-0 font-mono text-[11px] uppercase tracking-wider text-faint",
        className,
      )}
      {...props}
    />
  ),
);
TimelineTime.displayName = "TimelineTime";

export const TimelineDescription = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mt-1 text-sm text-muted", className)} {...props} />
  ),
);
TimelineDescription.displayName = "TimelineDescription";
