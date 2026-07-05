import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

type Tone
  = | "neutral"
    | "accent"
    | "amber"
    | "coral"
    | "sage"
    | "sky"
    | "ink"
    | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent-soft text-[#5a3ee0]",
  amber: "bg-amber-soft text-[#b45309]",
  coral: "bg-coral-soft text-[#c0383c]",
  sage: "bg-sage-soft text-[#15803d]",
  sky: "bg-sky-soft text-[#2f5fd0]",
  ink: "bg-ink text-white",
  outline: "bg-surface text-muted border border-line",
};

const dotColor: Partial<Record<Tone, string>> = {
  accent: "bg-accent",
  amber: "bg-amber-deep",
  coral: "bg-coral",
  sage: "bg-sage",
  sky: "bg-sky",
  neutral: "bg-faint",
};

export function badgeVariants({
  tone = "neutral",
  className,
}: { tone?: Tone; className?: string } = {}) {
  return cn(
    "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium [&_svg]:pointer-events-none [&_svg]:size-3",
    tones[tone],
    className,
  );
}

export type BadgeProps = {
  tone?: Tone;
  /** Leading status dot tinted to the tone. */
  dot?: boolean;
  /** Render the child element instead of a `<span>`, merging styles onto it. */
  asChild?: boolean;
} & React.HTMLAttributes<HTMLSpanElement>;

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = "neutral", dot = false, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";
    return (
      <Comp ref={ref} className={badgeVariants({ tone, className })} {...props}>
        {dot && !asChild && (
          <span
            className={cn("size-1.5 rounded-full", dotColor[tone] ?? "bg-current")}
          />
        )}
        {children}
      </Comp>
    );
  },
);
Badge.displayName = "Badge";
