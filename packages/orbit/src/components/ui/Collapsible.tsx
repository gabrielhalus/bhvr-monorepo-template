import * as RCollapsible from "@radix-ui/react-collapsible";

/**
 * Collapsible — single open/closed region on Radix (shadcn-style). Re-exported
 * bare; style the trigger/content at the call site (or wrap with your own button).
 *
 *   <Collapsible>
 *     <CollapsibleTrigger asChild><Button variant="ghost">Voir plus</Button></CollapsibleTrigger>
 *     <CollapsibleContent>…</CollapsibleContent>
 *   </Collapsible>
 */

export const Collapsible = RCollapsible.Root;
export const CollapsibleTrigger = RCollapsible.Trigger;
export const CollapsibleContent = RCollapsible.Content;
