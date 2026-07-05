import { cn } from "~orbit/lib/utils";

/** Loading placeholder with a soft shimmer sweep. */
export function Skeleton({
  className,
  rounded = "md",
}: {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "pill" | "full";
}) {
  const radius = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    pill: "rounded-pill",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden bg-surface-2", radius, className)}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-paper/70 to-transparent" />
    </div>
  );
}

/** Stacked text lines — last line is shortened for a natural paragraph shape. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-label="Chargement" className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          rounded="pill"
          className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
