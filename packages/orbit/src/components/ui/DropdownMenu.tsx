import * as RMenu from "@radix-ui/react-dropdown-menu";
import { forwardRef } from "react";

import { ChevronRight } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

/**
 * DropdownMenu — composable menu on Radix (shadcn-style).
 *
 *   <DropdownMenu>
 *     <DropdownMenuTrigger asChild><Button …/></DropdownMenuTrigger>
 *     <DropdownMenuContent>
 *       <DropdownMenuLabel>Actions</DropdownMenuLabel>
 *       <DropdownMenuItem>Renommer</DropdownMenuItem>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuItem variant="danger">Supprimer</DropdownMenuItem>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 */

export const DropdownMenu = RMenu.Root;
export const DropdownMenuTrigger = RMenu.Trigger;
export const DropdownMenuGroup = RMenu.Group;

export const DropdownMenuContent = forwardRef<
  React.ElementRef<typeof RMenu.Content>,
  React.ComponentPropsWithoutRef<typeof RMenu.Content>
>(({ className, sideOffset = 6, align = "end", ...props }, ref) => (
  <RMenu.Portal>
    <RMenu.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-44 overflow-hidden rounded-lg border border-line bg-surface p-1.5 shadow-raised",
        className,
      )}
      {...props}
    />
  </RMenu.Portal>
));
DropdownMenuContent.displayName = RMenu.Content.displayName;

export const DropdownMenuItem = forwardRef<
  React.ElementRef<typeof RMenu.Item>,
  React.ComponentPropsWithoutRef<typeof RMenu.Item> & {
    variant?: "default" | "danger";
    inset?: boolean;
  }
>(({ className, variant = "default", inset, ...props }, ref) => (
  <RMenu.Item
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      "data-disabled:pointer-events-none data-disabled:opacity-40",
      inset && "pl-8",
      variant === "danger"
        ? "text-coral-deep data-highlighted:bg-coral-soft"
        : "text-ink data-highlighted:bg-surface-2",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = RMenu.Item.displayName;

export const DropdownMenuLabel = forwardRef<
  React.ElementRef<typeof RMenu.Label>,
  React.ComponentPropsWithoutRef<typeof RMenu.Label>
>(({ className, ...props }, ref) => (
  <RMenu.Label
    ref={ref}
    className={cn("px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-faint", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = RMenu.Label.displayName;

export const DropdownMenuSeparator = forwardRef<
  React.ElementRef<typeof RMenu.Separator>,
  React.ComponentPropsWithoutRef<typeof RMenu.Separator>
>(({ className, ...props }, ref) => (
  <RMenu.Separator ref={ref} className={cn("my-1.5 h-px bg-line", className)} {...props} />
));
DropdownMenuSeparator.displayName = RMenu.Separator.displayName;

export const DropdownMenuSub = RMenu.Sub;

export const DropdownMenuSubTrigger = forwardRef<
  React.ElementRef<typeof RMenu.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof RMenu.SubTrigger> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <RMenu.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink outline-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      "data-disabled:pointer-events-none data-disabled:opacity-40 data-highlighted:bg-surface-2 data-[state=open]:bg-surface-2",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto size-4 text-faint" />
  </RMenu.SubTrigger>
));
DropdownMenuSubTrigger.displayName = RMenu.SubTrigger.displayName;

export const DropdownMenuSubContent = forwardRef<
  React.ElementRef<typeof RMenu.SubContent>,
  React.ComponentPropsWithoutRef<typeof RMenu.SubContent>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <RMenu.Portal>
    <RMenu.SubContent
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-44 overflow-hidden rounded-lg border border-line bg-surface p-1.5 shadow-raised",
        className,
      )}
      {...props}
    />
  </RMenu.Portal>
));
DropdownMenuSubContent.displayName = RMenu.SubContent.displayName;
