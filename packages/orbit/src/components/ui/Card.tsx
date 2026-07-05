import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/**
 * Card — composable floating surface (shadcn-style parts).
 *
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>…</CardTitle>
 *       <CardDescription>…</CardDescription>
 *       <CardAction><Button …/></CardAction>
 *     </CardHeader>
 *     <CardContent>…</CardContent>
 *     <CardFooter>…</CardFooter>
 *   </Card>
 *
 * Prefer `Panel` for product/app surfaces; `Card` is for the docs showcase.
 */

type Variant = "surface" | "ink" | "accent" | "amber" | "outline";

const variants: Record<Variant, string> = {
  surface: "bg-surface text-ink border border-line shadow-soft",
  ink: "bg-ink text-paper border border-line-ink shadow-raised",
  accent: "bg-accent text-white border border-accent-deep/40 shadow-soft",
  amber: "bg-amber text-ink border border-amber-deep/40 shadow-soft",
  outline: "bg-transparent text-ink border border-line",
};

export type CardProps = {
  variant?: Variant;
  /** Lift + raise the shadow on hover. */
  hover?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "surface", hover = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col rounded-xl",
        variants[variant],
        hover
        && "transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-raised",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "grid auto-rows-min grid-cols-[1fr_auto] items-start gap-x-3 gap-y-1 p-5 pb-0",
        className,
      )}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg/tight font-semibold", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

/** Sits in the header's trailing column (e.g. a menu or button). */
export const CardAction = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)} {...props} />
  ),
);
CardAction.displayName = "CardAction";

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-3 p-5 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";
