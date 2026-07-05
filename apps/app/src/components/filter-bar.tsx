import { cn } from "~orbit/lib/utils";

/**
 * Shared filter toolbar (Orbit-styled), matching the orders page: a hairline-
 * framed `surface` bar holding a borderless segmented tab group plus any search
 * inputs, dropdown filters or view toggles.
 */

export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2.5 shadow-soft", className)}>
      {children}
    </section>
  );
}

export function FilterTabs({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-0.5 rounded-lg bg-surface-2 p-0.5", className)}>
      {children}
    </div>
  );
}

export function FilterTab({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-surface text-ink shadow-soft" : "text-muted hover:text-ink",
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn("rounded px-1 font-mono text-[10px]", active ? "bg-accent-soft text-accent-deep" : "bg-surface text-faint")}>
          {count}
        </span>
      )}
    </button>
  );
}
