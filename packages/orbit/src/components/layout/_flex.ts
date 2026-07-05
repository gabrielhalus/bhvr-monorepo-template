/**
 * Shared flexbox token maps for the layout primitives (Stack, Cluster, AutoGrid).
 * Internal — not a component. Kept as literal class strings so Tailwind's scanner
 * keeps them in the build.
 */

export type Gap = "none" | "xs" | "sm" | "md" | "lg" | "xl";
export const gaps: Record<Gap, string> = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

export type Align = "start" | "center" | "end" | "stretch" | "baseline";
export const aligns: Record<Align, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

export type Justify = "start" | "center" | "end" | "between" | "around";
export const justifies: Record<Justify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};
