import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

import { ChevronRight, MoreHorizontal } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

/**
 * Breadcrumb — composable navigation trail (shadcn-style).
 *
 *   <Breadcrumb>
 *     <BreadcrumbList>
 *       <BreadcrumbItem><BreadcrumbLink href="/">Projets</BreadcrumbLink></BreadcrumbItem>
 *       <BreadcrumbSeparator />
 *       <BreadcrumbItem><BreadcrumbPage>Refonte</BreadcrumbPage></BreadcrumbItem>
 *     </BreadcrumbList>
 *   </Breadcrumb>
 */

export const Breadcrumb = forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"nav">>(
  ({ ...props }, ref) => <nav ref={ref} aria-label="Fil d'Ariane" {...props} />,
);
Breadcrumb.displayName = "Breadcrumb";

export const BreadcrumbList = forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<"ol">>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn("flex flex-wrap items-center gap-1 font-mono text-[12px]", className)}
      {...props}
    />
  ),
);
BreadcrumbList.displayName = "BreadcrumbList";

export const BreadcrumbItem = forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("flex items-center gap-1", className)} {...props} />
  ),
);
BreadcrumbItem.displayName = "BreadcrumbItem";

export const BreadcrumbLink = forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      ref={ref}
      className={cn(
        "rounded-md px-1.5 py-0.5 text-muted outline-none transition-colors hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/50",
        className,
      )}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = "BreadcrumbLink";

export const BreadcrumbPage = forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("px-1.5 py-0.5 font-medium text-ink", className)}
      {...props}
    />
  ),
);
BreadcrumbPage.displayName = "BreadcrumbPage";

export function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"li">) {
  return (
    <li role="presentation" aria-hidden className={cn("flex items-center", className)} {...props}>
      {children ?? <ChevronRight className="size-3.5 text-faint" />}
    </li>
  );
}

export function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"span">) {
  return (
    <span role="presentation" aria-hidden className={cn("flex items-center px-1", className)} {...props}>
      <MoreHorizontal className="size-3.5 text-faint" />
    </span>
  );
}
