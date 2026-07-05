import * as RAccordion from "@radix-ui/react-accordion";
import { forwardRef } from "react";

import { ChevronDown } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

/**
 * Accordion — composable disclosure list on Radix (shadcn-style).
 *
 *   <Accordion type="single" collapsible>
 *     <AccordionItem value="a">
 *       <AccordionTrigger>Détails</AccordionTrigger>
 *       <AccordionContent>…</AccordionContent>
 *     </AccordionItem>
 *   </Accordion>
 */

export const Accordion = RAccordion.Root;

export const AccordionItem = forwardRef<
  React.ElementRef<typeof RAccordion.Item>,
  React.ComponentPropsWithoutRef<typeof RAccordion.Item>
>(({ className, ...props }, ref) => (
  <RAccordion.Item ref={ref} className={cn("border-b border-line", className)} {...props} />
));
AccordionItem.displayName = RAccordion.Item.displayName;

export const AccordionTrigger = forwardRef<
  React.ElementRef<typeof RAccordion.Trigger>,
  React.ComponentPropsWithoutRef<typeof RAccordion.Trigger>
>(({ className, children, ...props }, ref) => (
  <RAccordion.Header className="flex">
    <RAccordion.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between gap-4 py-4 text-left text-sm font-medium text-ink outline-none transition-colors",
        "hover:text-accent focus-visible:text-accent [&[data-state=open]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="size-4 shrink-0 text-muted transition-transform duration-200 ease-out-expo" />
    </RAccordion.Trigger>
  </RAccordion.Header>
));
AccordionTrigger.displayName = RAccordion.Trigger.displayName;

export const AccordionContent = forwardRef<
  React.ElementRef<typeof RAccordion.Content>,
  React.ComponentPropsWithoutRef<typeof RAccordion.Content>
>(({ className, children, ...props }, ref) => (
  <RAccordion.Content
    ref={ref}
    className="overflow-hidden text-sm text-muted data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </RAccordion.Content>
));
AccordionContent.displayName = RAccordion.Content.displayName;
