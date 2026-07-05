import { cn } from "~orbit/lib/utils";

/**
 * The Orbit brand mark: a 4-point star.
 * Recurs across the system as a logo, bullet, loader and decorative accent.
 */
export function Sparkle({
  className,
  strokeOnly = false,
}: {
  className?: string;
  strokeOnly?: boolean;
}) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} aria-hidden>
      <path
        d="M12 0c.9 6.8 4.3 10.2 11.1 11.1C16.3 12 12.9 15.4 12 22.2 11.1 15.4 7.7 12 0.9 11.1 7.7 10.2 11.1 6.8 12 0Z"
        transform="translate(0 1) scale(1 0.95)"
        fill={strokeOnly ? "none" : "currentColor"}
        stroke={strokeOnly ? "currentColor" : "none"}
        strokeWidth={strokeOnly ? 1.4 : 0}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Slow-spinning decorative star used as a section accent / loader. */
export function SparkleSpin({ className }: { className?: string }) {
  return <Sparkle className={cn("animate-spin-slow", className)} />;
}
