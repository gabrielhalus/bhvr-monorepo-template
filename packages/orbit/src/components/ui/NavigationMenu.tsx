import * as RNav from "@radix-ui/react-navigation-menu";
import { forwardRef } from "react";

import { ChevronDown } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

/**
 * NavigationMenu — composable site navigation on Radix (shadcn-style).
 *
 *   <NavigationMenu>
 *     <NavigationMenuList>
 *       <NavigationMenuItem>
 *         <NavigationMenuTrigger>Produit</NavigationMenuTrigger>
 *         <NavigationMenuContent>…liens…</NavigationMenuContent>
 *       </NavigationMenuItem>
 *       <NavigationMenuItem>
 *         <NavigationMenuLink href="#">Tarifs</NavigationMenuLink>
 *       </NavigationMenuItem>
 *     </NavigationMenuList>
 *   </NavigationMenu>
 */

export const NavigationMenuItem = RNav.Item;
export const NavigationMenuLink = RNav.Link;

export const NavigationMenu = forwardRef<
  React.ElementRef<typeof RNav.Root>,
  React.ComponentPropsWithoutRef<typeof RNav.Root>
>(({ className, children, ...props }, ref) => (
  <RNav.Root
    ref={ref}
    className={cn("relative z-10 flex max-w-max flex-1 items-center justify-center", className)}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </RNav.Root>
));
NavigationMenu.displayName = RNav.Root.displayName;

export const NavigationMenuList = forwardRef<
  React.ElementRef<typeof RNav.List>,
  React.ComponentPropsWithoutRef<typeof RNav.List>
>(({ className, ...props }, ref) => (
  <RNav.List
    ref={ref}
    className={cn("flex flex-1 list-none items-center justify-center gap-1", className)}
    {...props}
  />
));
NavigationMenuList.displayName = RNav.List.displayName;

export const NavigationMenuTrigger = forwardRef<
  React.ElementRef<typeof RNav.Trigger>,
  React.ComponentPropsWithoutRef<typeof RNav.Trigger>
>(({ className, children, ...props }, ref) => (
  <RNav.Trigger
    ref={ref}
    className={cn(
      "group inline-flex h-9 select-none items-center gap-1 rounded-md px-3 text-sm font-medium text-ink outline-none transition-colors",
      "hover:bg-surface-2 data-[state=open]:bg-surface-2 focus-visible:ring-4 focus-visible:ring-accent/15",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronDown
      className="size-3.5 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180"
      aria-hidden
    />
  </RNav.Trigger>
));
NavigationMenuTrigger.displayName = RNav.Trigger.displayName;

export const NavigationMenuContent = forwardRef<
  React.ElementRef<typeof RNav.Content>,
  React.ComponentPropsWithoutRef<typeof RNav.Content>
>(({ className, ...props }, ref) => (
  <RNav.Content
    ref={ref}
    className={cn(
      "absolute left-0 top-0 w-full p-3 sm:w-auto",
      "data-[motion=from-start]:animate-overlay-in data-[motion=from-end]:animate-overlay-in",
      className,
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = RNav.Content.displayName;

export const NavigationMenuViewport = forwardRef<
  React.ElementRef<typeof RNav.Viewport>,
  React.ComponentPropsWithoutRef<typeof RNav.Viewport>
>(({ className, ...props }, ref) => (
  <div className="absolute left-0 top-full flex justify-center">
    <RNav.Viewport
      ref={ref}
      className={cn(
        "relative mt-2 h-(--radix-navigation-menu-viewport-height) w-full origin-top overflow-hidden rounded-xl border border-line bg-surface shadow-pop",
        "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out sm:w-(--radix-navigation-menu-viewport-width)",
        className,
      )}
      {...props}
    />
  </div>
));
NavigationMenuViewport.displayName = RNav.Viewport.displayName;
