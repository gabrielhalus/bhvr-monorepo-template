import { cn } from "~orbit/lib/utils";

/** Shared list/table primitives (Orbit-styled): stat tiles, table shell, rows, pager, header cell. */

export function StatCell({ label, value, hint, led }: { label: string; value: string; hint?: string; led?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-center gap-1.5">
        {led && <span className={cn("size-1.5 rounded-full", led)} />}
        <span className="text-xs text-muted">{label}</span>
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums text-ink">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

export type StatStripCell = { label: string; value: React.ReactNode; led?: string; hint?: React.ReactNode };

/** Joined strip of stat cells with hairline dividers (Orbit-styled). */
export function StatStrip({ cells, className }: { cells: StatStripCell[]; className?: string }) {
  return (
    <section
      className={cn("grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface shadow-soft md:grid-cols-[repeat(var(--du-cols),minmax(0,1fr))]", className)}
      style={{ ["--du-cols" as string]: cells.length }}
    >
      {cells.map((c, i) => (
        <div key={c.label} className={cn("border-b border-r border-line p-4 last:border-r-0 md:border-b-0 md:px-5", i % 2 === 1 && "border-r-0 md:border-r")}>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
            {c.led && <span className={cn("size-1.5 rounded-full", c.led)} />}
            <span className="truncate">{c.label}</span>
          </div>
          <div className="text-xl font-bold tabular-nums tracking-tight text-ink md:text-[22px]">{c.value}</div>
          {c.hint && <div className="mt-1.5 text-[11px] text-muted">{c.hint}</div>}
        </div>
      ))}
    </section>
  );
}

/**
 * Pager — the single pagination control shared by every list in the app
 * (generic `DataTable` and the hand-rolled business tables). Renders numbered
 * pages with ellipsis; collapses to nothing on a single page.
 */
export function Pager({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (p: number) => void }) {
  if (pageCount <= 1) return null;
  const pages: { key: string; page?: number }[] = [];
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) pages.push({ key: `page-${i}`, page: i });
    else if (pages[pages.length - 1]?.page !== undefined) pages.push({ key: `gap-${i}` });
  }
  const pg = "grid size-[26px] place-items-center rounded-md border border-transparent text-xs font-medium text-muted transition-colors hover:border-line hover:bg-surface hover:text-ink disabled:pointer-events-none disabled:opacity-40";
  return (
    <div className="flex gap-1">
      <button type="button" className={pg} disabled={page <= 1} onClick={() => onPage(page - 1)}>‹</button>
      {pages.map((p) => {
        if (p.page === undefined) return <button type="button" key={p.key} className={pg} disabled>…</button>;
        const n = p.page;
        return <button type="button" key={p.key} className={cn(pg, n === page && "border-transparent! bg-ink! text-white!")} onClick={() => onPage(n)}>{n}</button>;
      })}
      <button type="button" className={pg} disabled={page >= pageCount} onClick={() => onPage(page + 1)}>›</button>
    </div>
  );
}

/** Table header cell — mono/uppercase hairline label. Use inside `<thead><tr>`. */
export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-2.5 text-left font-mono text-[11px] font-semibold uppercase tracking-wider text-faint", className)}>{children}</th>;
}

/** Horizontal-scroll container wrapping the shared `<table>` chrome. */
export function DataTableShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

/**
 * TableRow — shared `<tr>` chrome for hand-rolled tables. Handles the common
 * hover / hairline / selection / dimmed states. When `onClick` is set the row
 * is interactive and clicks are ignored on any descendant marked `data-stop`
 * (menus, switches, checkboxes).
 */
export function TableRow({ onClick, selected, dim, className, children }: {
  onClick?: () => void;
  selected?: boolean;
  dim?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <tr
      className={cn(
        "group border-b border-line transition-colors last:border-0",
        onClick && "cursor-pointer",
        selected ? "bg-accent-soft" : "hover:bg-surface-2",
        dim && "opacity-60",
        className,
      )}
      onClick={onClick ? (e) => { if (!(e.target as HTMLElement).closest("[data-stop]")) onClick(); } : undefined}
    >
      {children}
    </tr>
  );
}

/** Table footer bar: left-aligned summary (children) + shared `Pager` on the right. */
export function TableFooter({ children, page, pageCount, onPage }: {
  children?: React.ReactNode;
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-line px-5 py-2.5 text-xs text-muted">
      <div className="min-w-0 truncate">{children}</div>
      <Pager page={page} pageCount={pageCount} onPage={onPage} />
    </div>
  );
}
