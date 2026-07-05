import * as RTabs from "@radix-ui/react-tabs";
import * as RToggle from "@radix-ui/react-toggle-group";
import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/**
 * Tabs — composable underline tabs on Radix (shadcn-style).
 *
 *   <Tabs defaultValue="board">
 *     <TabsList>
 *       <TabsTrigger value="board">Tableau</TabsTrigger>
 *       <TabsTrigger value="list">Liste</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="board">…</TabsContent>
 *   </Tabs>
 */

export const Tabs = RTabs.Root;

export const TabsList = forwardRef<
  React.ElementRef<typeof RTabs.List>,
  React.ComponentPropsWithoutRef<typeof RTabs.List>
>(({ className, ...props }, ref) => (
  <RTabs.List
    ref={ref}
    className={cn("flex items-center gap-1 border-b border-line", className)}
    {...props}
  />
));
TabsList.displayName = RTabs.List.displayName;

export const TabsTrigger = forwardRef<
  React.ElementRef<typeof RTabs.Trigger>,
  React.ComponentPropsWithoutRef<typeof RTabs.Trigger>
>(({ className, ...props }, ref) => (
  <RTabs.Trigger
    ref={ref}
    className={cn(
      "relative -mb-px px-3.5 py-2.5 text-sm font-medium outline-none transition-colors",
      "text-muted hover:text-ink data-[state=active]:text-ink",
      "after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:rounded-full after:bg-ink after:opacity-0 data-[state=active]:after:opacity-100",
      "focus-visible:ring-4 focus-visible:ring-accent/40 focus-visible:rounded-md disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = RTabs.Trigger.displayName;

export const TabsContent = forwardRef<
  React.ElementRef<typeof RTabs.Content>,
  React.ComponentPropsWithoutRef<typeof RTabs.Content>
>(({ className, ...props }, ref) => (
  <RTabs.Content
    ref={ref}
    className={cn("outline-none focus-visible:ring-4 focus-visible:ring-accent/25", className)}
    {...props}
  />
));
TabsContent.displayName = RTabs.Content.displayName;

/**
 * Segmented — composable pill control on Radix ToggleGroup (single choice).
 *
 *   <Segmented value={v} onValueChange={setV}>
 *     <SegmentedItem value="day">Jour</SegmentedItem>
 *     <SegmentedItem value="week">Semaine</SegmentedItem>
 *   </Segmented>
 */
export const Segmented = forwardRef<
  React.ElementRef<typeof RToggle.Root>,
  Omit<
    React.ComponentPropsWithoutRef<typeof RToggle.Root>,
    "type" | "value" | "defaultValue" | "onValueChange"
  > & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
  }
>(({ className, ...props }, ref) => (
  <RToggle.Root
    ref={ref}
    type="single"
    className={cn(
      "inline-flex items-center gap-1 rounded-lg border border-line bg-surface-2 p-1",
      className,
    )}
    {...props}
  />
));
Segmented.displayName = "Segmented";

export const SegmentedItem = forwardRef<
  React.ElementRef<typeof RToggle.Item>,
  React.ComponentPropsWithoutRef<typeof RToggle.Item>
>(({ className, ...props }, ref) => (
  <RToggle.Item
    ref={ref}
    className={cn(
      "rounded-md px-3 py-1.5 text-[13px] font-medium outline-none transition-all",
      "text-muted hover:text-ink data-[state=on]:bg-surface data-[state=on]:text-ink data-[state=on]:shadow-soft",
      "focus-visible:ring-4 focus-visible:ring-accent/25 disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
SegmentedItem.displayName = "SegmentedItem";
