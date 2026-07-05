import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/* ============================================================
   Typography — composable text primitives (Inter everywhere).
   Tones use the darkened -deep tints so solid colours stay AA
   on white/canvas. `faint` is for meta/labels only.
   ============================================================ */

type Tone = "default" | "muted" | "faint" | "accent" | "success" | "danger" | "inverse";
const tones: Record<Tone, string> = {
  default: "text-ink",
  muted: "text-muted",
  faint: "text-faint",
  accent: "text-accent-deep",
  success: "text-sage-deep",
  danger: "text-coral-deep",
  inverse: "text-paper",
};

type Weight = "normal" | "medium" | "semibold" | "bold";
const weights: Record<Weight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

/* ---------------- Heading ---------------- */

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type HeadingSize = "display" | "xl" | "lg" | "md" | "sm" | "xs";

const headingSizes: Record<HeadingSize, string> = {
  display: "text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]",
  xl: "text-4xl md:text-5xl font-bold tracking-tight",
  lg: "text-3xl font-bold tracking-tight",
  md: "text-2xl font-bold tracking-tight",
  sm: "text-xl font-semibold tracking-tight",
  xs: "text-lg font-semibold",
};

export type HeadingProps = {
  /** Rendered tag — decouples semantic level from visual size. */
  as?: HeadingLevel;
  size?: HeadingSize;
  tone?: Tone;
  asChild?: boolean;
} & React.HTMLAttributes<HTMLHeadingElement>;

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, as = "h2", size = "md", tone = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : as;
    return (
      <Comp
        ref={ref}
        className={cn("font-display text-balance", headingSizes[size], tones[tone], className)}
        {...props}
      />
    );
  },
);
Heading.displayName = "Heading";

/* ---------------- Text ---------------- */

type TextSize = "xs" | "sm" | "base" | "lg";
const textSizes: Record<TextSize, string> = {
  xs: "text-xs",
  sm: "text-[13px]",
  base: "text-[15px] leading-relaxed",
  lg: "text-lg leading-relaxed",
};

export type TextProps = {
  as?: "p" | "span" | "div" | "label" | "figcaption";
  size?: TextSize;
  tone?: Tone;
  weight?: Weight;
  asChild?: boolean;
} & React.HTMLAttributes<HTMLParagraphElement>;

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  (
    { className, as = "p", size = "base", tone = "default", weight = "normal", asChild = false, ...props },
    ref,
  ) => {
    const Comp: React.ElementType = asChild ? Slot : as;
    return (
      <Comp
        ref={ref}
        className={cn(textSizes[size], tones[tone], weights[weight], className)}
        {...props}
      />
    );
  },
);
Text.displayName = "Text";

/* ---------------- Lead — intro paragraph ---------------- */

export const Lead = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-balance text-lg/relaxed text-muted", className)} {...props} />
  ),
);
Lead.displayName = "Lead";

/* ---------------- Eyebrow — mono uppercase kicker ---------------- */

export type EyebrowProps = {
  tone?: "faint" | "muted" | "accent";
  asChild?: boolean;
} & React.HTMLAttributes<HTMLSpanElement>;

const eyebrowTones: Record<NonNullable<EyebrowProps["tone"]>, string> = {
  faint: "text-faint",
  muted: "text-muted",
  accent: "text-accent-deep",
};

export const Eyebrow = forwardRef<HTMLSpanElement, EyebrowProps>(
  ({ className, tone = "faint", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";
    return (
      <Comp
        ref={ref}
        className={cn(
          "font-mono text-[11px] uppercase tracking-wider",
          eyebrowTones[tone],
          className,
        )}
        {...props}
      />
    );
  },
);
Eyebrow.displayName = "Eyebrow";

/* ---------------- Inline code ---------------- */

export const InlineCode = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <code
      ref={ref}
      className={cn(
        "font-code rounded-md bg-surface-2 px-1.5 py-0.5 text-[0.85em] text-ink",
        className,
      )}
      {...props}
    />
  ),
);
InlineCode.displayName = "InlineCode";

/* ---------------- Kbd — keyboard key ---------------- */

export const Kbd = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <kbd
      ref={ref}
      className={cn(
        "font-code inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line bg-surface px-1.5 text-[11px] font-medium text-muted shadow-soft",
        className,
      )}
      {...props}
    />
  ),
);
Kbd.displayName = "Kbd";

/* ---------------- Blockquote ---------------- */

export const Blockquote = forwardRef<HTMLQuoteElement, React.HTMLAttributes<HTMLQuoteElement>>(
  ({ className, ...props }, ref) => (
    <blockquote
      ref={ref}
      className={cn("border-l-2 border-accent pl-4 text-[15px] italic leading-relaxed text-muted", className)}
      {...props}
    />
  ),
);
Blockquote.displayName = "Blockquote";

/* ---------------- Prose — long-form rich text ---------------- */

export const Prose = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "max-w-prose text-[15px] leading-relaxed text-ink",
        "[&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight",
        "[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold",
        "[&_p]:mb-4 [&_p:last-child]:mb-0",
        "[&_a]:font-medium [&_a]:text-accent-deep [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-accent",
        "[&_strong]:font-semibold [&_strong]:text-ink",
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
        "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5",
        "[&_code]:font-code [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.85em]",
        "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted",
        className,
      )}
      {...props}
    />
  ),
);
Prose.displayName = "Prose";
