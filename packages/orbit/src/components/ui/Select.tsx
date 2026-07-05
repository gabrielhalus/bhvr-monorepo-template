import * as RSelect from "@radix-ui/react-select";
import { forwardRef } from "react";

import { Check, ChevronDown, ChevronUp } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

/**
 * Select — composable dropdown on Radix (shadcn-style).
 *
 *   <Select value={v} onValueChange={setV}>
 *     <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
 *     <SelectContent>
 *       <SelectGroup>
 *         <SelectLabel>Clients</SelectLabel>
 *         <SelectItem value="acme">Acme</SelectItem>
 *       </SelectGroup>
 *     </SelectContent>
 *   </Select>
 */

export const Select = RSelect.Root;
export const SelectGroup = RSelect.Group;
export const SelectValue = RSelect.Value;

export const SelectTrigger = forwardRef<
  React.ElementRef<typeof RSelect.Trigger>,
  React.ComponentPropsWithoutRef<typeof RSelect.Trigger>
>(({ className, children, ...props }, ref) => (
  <RSelect.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3.5 text-sm text-ink outline-none transition-all",
      "data-placeholder:text-faint hover:border-line-strong",
      "focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15",
      "data-disabled:opacity-50 [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <RSelect.Icon asChild>
      <ChevronDown className="size-4 shrink-0 text-muted" />
    </RSelect.Icon>
  </RSelect.Trigger>
));
SelectTrigger.displayName = RSelect.Trigger.displayName;

export const SelectContent = forwardRef<
  React.ElementRef<typeof RSelect.Content>,
  React.ComponentPropsWithoutRef<typeof RSelect.Content>
>(({ className, children, position = "popper", sideOffset = 6, ...props }, ref) => (
  <RSelect.Portal>
    <RSelect.Content
      ref={ref}
      position={position}
      sideOffset={position === "popper" ? sideOffset : undefined}
      className={cn(
        "z-50 max-h-64 min-w-32 overflow-hidden rounded-lg border border-line bg-surface shadow-raised",
        position === "popper" && "min-w-(--radix-select-trigger-width)",
        className,
      )}
      {...props}
    >
      <RSelect.ScrollUpButton className="flex h-6 items-center justify-center text-muted">
        <ChevronUp className="size-4" />
      </RSelect.ScrollUpButton>
      <RSelect.Viewport className="p-1.5">{children}</RSelect.Viewport>
      <RSelect.ScrollDownButton className="flex h-6 items-center justify-center text-muted">
        <ChevronDown className="size-4" />
      </RSelect.ScrollDownButton>
    </RSelect.Content>
  </RSelect.Portal>
));
SelectContent.displayName = RSelect.Content.displayName;

export const SelectLabel = forwardRef<
  React.ElementRef<typeof RSelect.Label>,
  React.ComponentPropsWithoutRef<typeof RSelect.Label>
>(({ className, ...props }, ref) => (
  <RSelect.Label
    ref={ref}
    className={cn("px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-faint", className)}
    {...props}
  />
));
SelectLabel.displayName = RSelect.Label.displayName;

export const SelectItem = forwardRef<
  React.ElementRef<typeof RSelect.Item>,
  React.ComponentPropsWithoutRef<typeof RSelect.Item>
>(({ className, children, ...props }, ref) => (
  <RSelect.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-8 text-sm text-ink outline-none",
      "data-highlighted:bg-surface-2 data-[state=checked]:font-semibold",
      "data-disabled:pointer-events-none data-disabled:opacity-40",
      className,
    )}
    {...props}
  >
    <RSelect.ItemText>{children}</RSelect.ItemText>
    <RSelect.ItemIndicator className="absolute right-2.5">
      <Check className="size-4 text-accent-deep" strokeWidth={2.5} />
    </RSelect.ItemIndicator>
  </RSelect.Item>
));
SelectItem.displayName = RSelect.Item.displayName;

export const SelectSeparator = forwardRef<
  React.ElementRef<typeof RSelect.Separator>,
  React.ComponentPropsWithoutRef<typeof RSelect.Separator>
>(({ className, ...props }, ref) => (
  <RSelect.Separator ref={ref} className={cn("my-1.5 h-px bg-line", className)} {...props} />
));
SelectSeparator.displayName = RSelect.Separator.displayName;
