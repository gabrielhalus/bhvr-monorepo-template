import * as RToolbar from "@radix-ui/react-toolbar";
import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/**
 * Toolbar — composable action bar on Radix (shadcn-style). Groups buttons,
 * toggle groups and separators with shared keyboard navigation.
 *
 *   <Toolbar>
 *     <ToolbarToggleGroup type="single" defaultValue="left">
 *       <ToolbarToggleItem value="left"><AlignLeft/></ToolbarToggleItem>
 *     </ToolbarToggleGroup>
 *     <ToolbarSeparator />
 *     <ToolbarButton>Partager</ToolbarButton>
 *   </Toolbar>
 */

export const Toolbar = forwardRef<
  React.ElementRef<typeof RToolbar.Root>,
  React.ComponentPropsWithoutRef<typeof RToolbar.Root>
>(({ className, ...props }, ref) => (
  <RToolbar.Root
    ref={ref}
    className={cn(
      "flex items-center gap-1 rounded-lg border border-line bg-surface p-1 shadow-soft",
      className,
    )}
    {...props}
  />
));
Toolbar.displayName = RToolbar.Root.displayName;

export const ToolbarButton = forwardRef<
  React.ElementRef<typeof RToolbar.Button>,
  React.ComponentPropsWithoutRef<typeof RToolbar.Button>
>(({ className, ...props }, ref) => (
  <RToolbar.Button
    ref={ref}
    className={cn(
      "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-ink outline-none transition-colors",
      "hover:bg-surface-2 focus-visible:ring-4 focus-visible:ring-accent/15 disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4",
      className,
    )}
    {...props}
  />
));
ToolbarButton.displayName = RToolbar.Button.displayName;

export const ToolbarLink = forwardRef<
  React.ElementRef<typeof RToolbar.Link>,
  React.ComponentPropsWithoutRef<typeof RToolbar.Link>
>(({ className, ...props }, ref) => (
  <RToolbar.Link
    ref={ref}
    className={cn(
      "inline-flex h-8 cursor-pointer items-center rounded-md px-2.5 text-sm font-medium text-ink underline-offset-4 outline-none transition-colors hover:bg-surface-2 focus-visible:ring-4 focus-visible:ring-accent/15",
      className,
    )}
    {...props}
  />
));
ToolbarLink.displayName = RToolbar.Link.displayName;

export const ToolbarSeparator = forwardRef<
  React.ElementRef<typeof RToolbar.Separator>,
  React.ComponentPropsWithoutRef<typeof RToolbar.Separator>
>(({ className, ...props }, ref) => (
  <RToolbar.Separator ref={ref} className={cn("mx-1 h-6 w-px bg-line", className)} {...props} />
));
ToolbarSeparator.displayName = RToolbar.Separator.displayName;

export const ToolbarToggleGroup = forwardRef<
  React.ElementRef<typeof RToolbar.ToggleGroup>,
  React.ComponentPropsWithoutRef<typeof RToolbar.ToggleGroup>
>(({ className, ...props }, ref) => (
  <RToolbar.ToggleGroup ref={ref} className={cn("flex items-center gap-0.5", className)} {...props} />
));
ToolbarToggleGroup.displayName = RToolbar.ToggleGroup.displayName;

export const ToolbarToggleItem = forwardRef<
  React.ElementRef<typeof RToolbar.ToggleItem>,
  React.ComponentPropsWithoutRef<typeof RToolbar.ToggleItem>
>(({ className, ...props }, ref) => (
  <RToolbar.ToggleItem
    ref={ref}
    className={cn(
      "inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted outline-none transition-colors",
      "hover:bg-surface-2 hover:text-ink focus-visible:ring-4 focus-visible:ring-accent/15",
      "data-[state=on]:bg-accent-soft data-[state=on]:text-[#5a3ee0] [&_svg]:size-4",
      className,
    )}
    {...props}
  />
));
ToolbarToggleItem.displayName = RToolbar.ToggleItem.displayName;
