import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

type Variant = "primary" | "dark" | "outline" | "ghost" | "danger" | "amber";
type Size = "sm" | "md" | "lg" | "icon";

const base
  = "relative inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap rounded-lg transition-all duration-150 ease-[var(--ease-out-expo)] focus-ring active:translate-y-px disabled:pointer-events-none disabled:opacity-45 select-none [&_svg]:pointer-events-none [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white shadow-soft hover:bg-accent-deep",
  dark: "bg-ink text-white shadow-soft hover:bg-ink-soft",
  amber: "bg-amber text-ink shadow-soft hover:bg-amber-deep",
  outline:
    "bg-surface text-ink border border-line shadow-soft hover:bg-surface-2 hover:border-line-strong",
  ghost: "bg-transparent text-muted hover:bg-surface-2 hover:text-ink",
  danger: "bg-coral text-white shadow-soft hover:bg-coral-deep",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
  icon: "h-10 w-10 p-0",
};

/**
 * Style recipe shared by `Button` and any element that should look like one.
 * Use with `asChild` or on a bare `<a>`: `className={buttonVariants({ variant: "outline" })}`.
 */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export type ButtonProps = {
  variant?: Variant;
  size?: Size;
  /** Render the child element instead of a `<button>`, merging styles onto it. */
  asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
