import * as RMenubar from "@radix-ui/react-menubar";
import { forwardRef } from "react";

import { Check, ChevronRight, Circle } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

/**
 * Menubar — composable application menu bar on Radix (shadcn-style).
 *
 *   <Menubar>
 *     <MenubarMenu>
 *       <MenubarTrigger>Fichier</MenubarTrigger>
 *       <MenubarContent>
 *         <MenubarItem>Nouveau</MenubarItem>
 *         <MenubarSeparator />
 *         <MenubarItem>Quitter</MenubarItem>
 *       </MenubarContent>
 *     </MenubarMenu>
 *   </Menubar>
 */

export const MenubarMenu = RMenubar.Menu;
export const MenubarGroup = RMenubar.Group;
export const MenubarRadioGroup = RMenubar.RadioGroup;
export const MenubarSub = RMenubar.Sub;

const contentClass
  = "z-50 min-w-44 overflow-hidden rounded-lg border border-line bg-surface p-1.5 shadow-raised data-[state=open]:animate-pop-in";
const itemClass
  = "relative flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 data-[disabled]:pointer-events-none data-[disabled]:opacity-40";

export const Menubar = forwardRef<
  React.ElementRef<typeof RMenubar.Root>,
  React.ComponentPropsWithoutRef<typeof RMenubar.Root>
>(({ className, ...props }, ref) => (
  <RMenubar.Root
    ref={ref}
    className={cn(
      "flex items-center gap-0.5 rounded-lg border border-line bg-surface p-1 shadow-soft",
      className,
    )}
    {...props}
  />
));
Menubar.displayName = RMenubar.Root.displayName;

export const MenubarTrigger = forwardRef<
  React.ElementRef<typeof RMenubar.Trigger>,
  React.ComponentPropsWithoutRef<typeof RMenubar.Trigger>
>(({ className, ...props }, ref) => (
  <RMenubar.Trigger
    ref={ref}
    className={cn(
      "select-none rounded-md px-3 py-1.5 text-sm font-medium text-ink outline-none transition-colors",
      "data-highlighted:bg-surface-2 data-[state=open]:bg-surface-2",
      className,
    )}
    {...props}
  />
));
MenubarTrigger.displayName = RMenubar.Trigger.displayName;

export const MenubarContent = forwardRef<
  React.ElementRef<typeof RMenubar.Content>,
  React.ComponentPropsWithoutRef<typeof RMenubar.Content>
>(({ className, align = "start", sideOffset = 6, ...props }, ref) => (
  <RMenubar.Portal>
    <RMenubar.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(contentClass, className)}
      {...props}
    />
  </RMenubar.Portal>
));
MenubarContent.displayName = RMenubar.Content.displayName;

export const MenubarItem = forwardRef<
  React.ElementRef<typeof RMenubar.Item>,
  React.ComponentPropsWithoutRef<typeof RMenubar.Item> & {
    variant?: "default" | "danger";
    inset?: boolean;
  }
>(({ className, variant = "default", inset, ...props }, ref) => (
  <RMenubar.Item
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
MenubarItem.displayName = RMenubar.Item.displayName;

export const MenubarCheckboxItem = forwardRef<
  React.ElementRef<typeof RMenubar.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof RMenubar.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <RMenubar.CheckboxItem
    ref={ref}
    checked={checked}
    className={cn(itemClass, "pl-8 text-ink data-highlighted:bg-surface-2", className)}
    {...props}
  >
    <span className="absolute left-2.5 grid size-4 place-items-center">
      <RMenubar.ItemIndicator>
        <Check className="size-4 text-accent-deep" strokeWidth={2.5} />
      </RMenubar.ItemIndicator>
    </span>
    {children}
  </RMenubar.CheckboxItem>
));
MenubarCheckboxItem.displayName = RMenubar.CheckboxItem.displayName;

export const MenubarRadioItem = forwardRef<
  React.ElementRef<typeof RMenubar.RadioItem>,
  React.ComponentPropsWithoutRef<typeof RMenubar.RadioItem>
>(({ className, children, ...props }, ref) => (
  <RMenubar.RadioItem
    ref={ref}
    className={cn(itemClass, "pl-8 text-ink data-highlighted:bg-surface-2", className)}
    {...props}
  >
    <span className="absolute left-2.5 grid size-4 place-items-center">
      <RMenubar.ItemIndicator>
        <Circle className="size-2 fill-accent-deep text-accent-deep" />
      </RMenubar.ItemIndicator>
    </span>
    {children}
  </RMenubar.RadioItem>
));
MenubarRadioItem.displayName = RMenubar.RadioItem.displayName;

export const MenubarLabel = forwardRef<
  React.ElementRef<typeof RMenubar.Label>,
  React.ComponentPropsWithoutRef<typeof RMenubar.Label>
>(({ className, ...props }, ref) => (
  <RMenubar.Label
    ref={ref}
    className={cn("px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-faint", className)}
    {...props}
  />
));
MenubarLabel.displayName = RMenubar.Label.displayName;

export const MenubarSeparator = forwardRef<
  React.ElementRef<typeof RMenubar.Separator>,
  React.ComponentPropsWithoutRef<typeof RMenubar.Separator>
>(({ className, ...props }, ref) => (
  <RMenubar.Separator ref={ref} className={cn("my-1.5 h-px bg-line", className)} {...props} />
));
MenubarSeparator.displayName = RMenubar.Separator.displayName;

export function MenubarShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ml-auto text-[11px] tracking-widest text-faint", className)} {...props} />;
}
MenubarShortcut.displayName = "MenubarShortcut";

export const MenubarSubTrigger = forwardRef<
  React.ElementRef<typeof RMenubar.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof RMenubar.SubTrigger> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <RMenubar.SubTrigger
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
  </RMenubar.SubTrigger>
));
MenubarSubTrigger.displayName = RMenubar.SubTrigger.displayName;

export const MenubarSubContent = forwardRef<
  React.ElementRef<typeof RMenubar.SubContent>,
  React.ComponentPropsWithoutRef<typeof RMenubar.SubContent>
>(({ className, ...props }, ref) => (
  <RMenubar.Portal>
    <RMenubar.SubContent ref={ref} className={cn(contentClass, className)} {...props} />
  </RMenubar.Portal>
));
MenubarSubContent.displayName = RMenubar.SubContent.displayName;
