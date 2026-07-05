import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/**
 * PageHeader — the title + actions row at the top of a workspace view. Composable
 * parts: nest a `PageHeaderHeading` (with `Eyebrow`/`Title`/`Description`) and a
 * `PageHeaderActions`. The row stacks vertically on narrow screens and becomes a
 * justified row at `sm`, so actions never crowd the title on mobile.
 *
 * ```tsx
 * <PageHeader>
 *   <PageHeaderHeading>
 *     <PageHeaderEyebrow>Workspace</PageHeaderEyebrow>
 *     <PageHeaderTitle>Vue d'ensemble</PageHeaderTitle>
 *     <PageHeaderDescription>3 projets actifs</PageHeaderDescription>
 *   </PageHeaderHeading>
 *   <PageHeaderActions>
 *     <Button size="sm">Nouveau</Button>
 *   </PageHeaderActions>
 * </PageHeader>
 * ```
 */
export const PageHeader = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    />
  ),
);
PageHeader.displayName = "PageHeader";

/** The titling column (left side) — groups eyebrow, title and description. */
export const PageHeaderHeading = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("min-w-0 space-y-1", className)} {...props} />
  ),
);
PageHeaderHeading.displayName = "PageHeaderHeading";

export const PageHeaderEyebrow = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("font-mono text-[11px] uppercase tracking-wider text-faint", className)}
      {...props}
    />
  ),
);
PageHeaderEyebrow.displayName = "PageHeaderEyebrow";

export const PageHeaderTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-xl font-bold tracking-tight sm:text-2xl", className)} {...props} />
));
PageHeaderTitle.displayName = "PageHeaderTitle";

export const PageHeaderDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted", className)} {...props} />
));
PageHeaderDescription.displayName = "PageHeaderDescription";

/** The trailing actions column (right side) — wraps onto its own line if tight. */
export const PageHeaderActions = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex shrink-0 flex-wrap items-center gap-2.5", className)}
      {...props}
    />
  ),
);
PageHeaderActions.displayName = "PageHeaderActions";
