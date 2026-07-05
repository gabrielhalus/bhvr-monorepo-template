import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/**
 * Alert — composable inline banner (shadcn-style).
 *
 *   <Alert variant="warning">
 *     <AlertTriangle />            // optional leading icon
 *     <AlertTitle>Échéance proche</AlertTitle>
 *     <AlertDescription>…</AlertDescription>
 *   </Alert>
 *
 * Soft tints keep AA contrast with ink/muted text (see a11y notes).
 */

type Variant = "info" | "success" | "warning" | "danger" | "accent";

const variants: Record<Variant, string> = {
  info: "bg-sky-soft border-sky/30 [&>svg]:text-[#2f5fd0]",
  success: "bg-sage-soft border-sage/30 [&>svg]:text-sage-deep",
  warning: "bg-amber-soft border-amber/40 [&>svg]:text-[#b45309]",
  danger: "bg-coral-soft border-coral/30 [&>svg]:text-[#c0383c]",
  accent: "bg-accent-soft border-accent/30 [&>svg]:text-[#5a3ee0]",
};

export const Alert = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: Variant }
>(({ className, variant = "info", role, ...props }, ref) => (
  <div
    ref={ref}
    role={role ?? (variant === "danger" || variant === "warning" ? "alert" : "status")}
    className={cn(
      "relative grid w-full grid-cols-[0_1fr] items-start gap-x-3 gap-y-0.5 rounded-lg border p-4 text-sm",
      "has-[>svg]:grid-cols-[1.25rem_1fr] [&>svg]:mt-0.5 [&>svg]:size-5 [&>svg]:shrink-0",
      variants[variant],
      className,
    )}
    {...props}
  />
));
Alert.displayName = "Alert";

export const AlertTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("col-start-2 font-display text-sm font-semibold tracking-tight text-ink", className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = "AlertTitle";

export const AlertDescription = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("col-start-2 text-sm text-ink/75", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";
