import * as RMenu from "@radix-ui/react-context-menu";
import { forwardRef } from "react";

import { Check, ChevronRight, Circle } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

/**
 * ContextMenu — composable right-click menu on Radix (shadcn-style).
 *
 *   <ContextMenu>
 *     <ContextMenuTrigger>Clic droit ici</ContextMenuTrigger>
 *     <ContextMenuContent>
 *       <ContextMenuItem>Éditer</ContextMenuItem>
 *       <ContextMenuSeparator />
 *       <ContextMenuItem variant="danger">Supprimer</ContextMenuItem>
 *     </ContextMenuContent>
 *   </ContextMenu>
 */

export const ContextMenu = RMenu.Root;
export const ContextMenuTrigger = RMenu.Trigger;
export const ContextMenuGroup = RMenu.Group;
export const ContextMenuRadioGroup = RMenu.RadioGroup;
export const ContextMenuSub = RMenu.Sub;

const contentClass
  = "z-50 min-w-44 overflow-hidden rounded-lg border border-line bg-surface p-1.5 shadow-raised data-[state=open]:animate-pop-in";
const itemClass
  = "relative flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 data-[disabled]:pointer-events-none data-[disabled]:opacity-40";

export const ContextMenuContent = forwardRef<
  React.ElementRef<typeof RMenu.Content>,
  React.ComponentPropsWithoutRef<typeof RMenu.Content>
>(({ className, ...props }, ref) => (
  <RMenu.Portal>
    <RMenu.Content ref={ref} className={cn(contentClass, className)} {...props} />
  </RMenu.Portal>
));
ContextMenuContent.displayName = RMenu.Content.displayName;

export const ContextMenuItem = forwardRef<
  React.ElementRef<typeof RMenu.Item>,
  React.ComponentPropsWithoutRef<typeof RMenu.Item> & {
    variant?: "default" | "danger";
    inset?: boolean;
  }
>(({ className, variant = "default", inset, ...props }, ref) => (
  <RMenu.Item
    ref={ref}
    className={cn(
      itemClass,
      inset && "pl-8",
      variant === "danger"
        ? "text-coral-deep data-highlighted:bg-coral-soft"
        : "text-ink data-highlighted:bg-surface-2",
      className,
    )}
    {...props}
  />
));
ContextMenuItem.displayName = RMenu.Item.displayName;

export const ContextMenuCheckboxItem = forwardRef<
  React.ElementRef<typeof RMenu.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof RMenu.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <RMenu.CheckboxItem
    ref={ref}
    checked={checked}
    className={cn(itemClass, "pl-8 text-ink data-highlighted:bg-surface-2", className)}
    {...props}
  >
    <span className="absolute left-2.5 grid size-4 place-items-center">
      <RMenu.ItemIndicator>
        <Check className="size-4 text-accent-deep" strokeWidth={2.5} />
      </RMenu.ItemIndicator>
    </span>
    {children}
  </RMenu.CheckboxItem>
));
ContextMenuCheckboxItem.displayName = RMenu.CheckboxItem.displayName;

export const ContextMenuRadioItem = forwardRef<
  React.ElementRef<typeof RMenu.RadioItem>,
  React.ComponentPropsWithoutRef<typeof RMenu.RadioItem>
>(({ className, children, ...props }, ref) => (
  <RMenu.RadioItem
    ref={ref}
    className={cn(itemClass, "pl-8 text-ink data-highlighted:bg-surface-2", className)}
    {...props}
  >
    <span className="absolute left-2.5 grid size-4 place-items-center">
      <RMenu.ItemIndicator>
        <Circle className="size-2 fill-accent-deep text-accent-deep" />
      </RMenu.ItemIndicator>
    </span>
    {children}
  </RMenu.RadioItem>
));
ContextMenuRadioItem.displayName = RMenu.RadioItem.displayName;

export const ContextMenuLabel = forwardRef<
  React.ElementRef<typeof RMenu.Label>,
  React.ComponentPropsWithoutRef<typeof RMenu.Label>
>(({ className, ...props }, ref) => (
  <RMenu.Label
    ref={ref}
    className={cn("px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-faint", className)}
    {...props}
  />
));
ContextMenuLabel.displayName = RMenu.Label.displayName;

export const ContextMenuSeparator = forwardRef<
  React.ElementRef<typeof RMenu.Separator>,
  React.ComponentPropsWithoutRef<typeof RMenu.Separator>
>(({ className, ...props }, ref) => (
  <RMenu.Separator ref={ref} className={cn("my-1.5 h-px bg-line", className)} {...props} />
));
ContextMenuSeparator.displayName = RMenu.Separator.displayName;

export const ContextMenuSubTrigger = forwardRef<
  React.ElementRef<typeof RMenu.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof RMenu.SubTrigger> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <RMenu.SubTrigger
    ref={ref}
    className={cn(
      itemClass,
      "text-ink data-highlighted:bg-surface-2 data-[state=open]:bg-surface-2",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto size-4 text-muted" />
  </RMenu.SubTrigger>
));
ContextMenuSubTrigger.displayName = RMenu.SubTrigger.displayName;

export const ContextMenuSubContent = forwardRef<
  React.ElementRef<typeof RMenu.SubContent>,
  React.ComponentPropsWithoutRef<typeof RMenu.SubContent>
>(({ className, ...props }, ref) => (
  <RMenu.Portal>
    <RMenu.SubContent ref={ref} className={cn(contentClass, className)} {...props} />
  </RMenu.Portal>
));
ContextMenuSubContent.displayName = RMenu.SubContent.displayName;
