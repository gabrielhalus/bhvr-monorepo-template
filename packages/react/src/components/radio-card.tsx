"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as React from "react";

import { cn } from "../lib/utils";

type RadioCardProps = {
  color?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof RadioGroupPrimitive.Item>, "children">;

function RadioCard({ className, color = "#3b82f6", children, ...props }: RadioCardProps) {
  // Compose the custom color shadow/border based on state
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-card"
      className={cn(
        "peer group relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-border p-6 transition-all outline-none",
        "hover:border-primary/30",
        "focus-visible:ring-4 focus-visible:ring-ring/50",
        "data-[state=checked]:shadow-lg",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={
        {
          // Provide dynamic css variable to be used for border
          "--radio-card-color": color,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </RadioGroupPrimitive.Item>
  );
}

// Global style for checked RadioCard
if (typeof window !== "undefined") {
  // Only inject once
  if (!document.getElementById("radio-card-styles")) {
    const style = document.createElement("style");
    style.id = "radio-card-styles";
    style.innerHTML = `
      [data-slot='radio-card'][data-state='checked'] {
        border-color: var(--radio-card-color) !important;
        box-shadow: 0 4px 6px -1px var(--radio-card-color, #3b82f6)1A,
                    0 2px 4px -2px var(--radio-card-color, #3b82f6)1A,
                    0 0 0 3px var(--radio-card-color, #3b82f6)1A;
      }
    `;
    document.head.appendChild(style);
  }
}

function RadioCardGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn("grid gap-4", className)} {...props} />;
}

export { RadioCard, RadioCardGroup, type RadioCardProps };
