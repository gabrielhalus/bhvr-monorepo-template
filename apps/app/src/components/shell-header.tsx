import { ArrowDownRight, ArrowUpRight } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

/**
 * ShellHeader — the desktop-shell page header: a solid, hairline-framed toolbar
 * (mono eyebrow + bold title + actions) optionally joined to a flush, hairline-
 * divided KPI strip rendered with Orbit `Stat` (no cards). Mirrors the Orbit
 * `DesktopShell` block. Page content sits in cards/panels below.
 */

export type ShellKpi = {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  /** Optional context line under the stat (e.g. "3 en retard"). */
  hint?: React.ReactNode;
};

export function ShellHeader({
  eyebrow,
  title,
  accent,
  actions,
  kpis,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  /** Append the violet ✦ accent after the title. */
  accent?: boolean;
  actions?: React.ReactNode;
  kpis?: ShellKpi[];
  /** Custom body rendered flush below the toolbar (instead of/with the KPI strip). */
  children?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          {eyebrow != null && (
            <p className="font-mono text-[11px] uppercase tracking-wide text-faint">{eyebrow}</p>
          )}
          <h1 className="mt-0.5 truncate text-xl font-bold tracking-tight text-ink md:text-2xl">
            {title}
            {accent && (
              <>
                {" "}
                <span className="text-accent-deep">✦</span>
              </>
            )}
          </h1>
        </div>
        {actions && <div className="flex items-center gap-2.5">{actions}</div>}
      </div>

      {kpis && kpis.length > 0 && <KpiStrip kpis={kpis} />}
      {children}
    </div>
  );
}

function KpiStrip({ kpis }: { kpis: ShellKpi[] }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-[repeat(var(--kpi-cols),minmax(0,1fr))]"
      style={{ ["--kpi-cols" as string]: kpis.length }}
    >
      {kpis.map((kpi, i) => {
        const inLastMobileRow = i >= (Math.ceil(kpis.length / 2) - 1) * 2;
        return (
          <div
            key={kpi.label}
            className={cn(
              "px-5 py-4",
              i % 2 === 1 && "border-l border-line",
              !inLastMobileRow && "border-b border-line",
              "sm:border-b-0",
              i > 0 && "sm:border-l sm:border-line",
            )}
          >
            <KpiCell kpi={kpi} />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Uniform-height KPI cell: label, value+unit, and a fixed-height bottom slot
 *  that holds the delta badge or hint (so every cell is the same height).
 */
function KpiCell({ kpi: { label, value, unit, delta, hint } }: { kpi: ShellKpi }) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="flex h-full flex-col gap-2.5">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <div className="flex items-end gap-1.5">
        <span className="font-display text-[28px] font-bold leading-none tracking-tight text-ink">{value}</span>
        {unit && <span className="pb-0.5 text-sm text-muted">{unit}</span>}
      </div>
      <div className="mt-auto flex min-h-5 items-center">
        {delta !== undefined
          ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-semibold",
                  up ? "bg-sage-soft text-[#15803d]" : "bg-coral-soft text-[#c0383c]",
                )}
              >
                {up ? <ArrowUpRight className="size-3" strokeWidth={2.5} /> : <ArrowDownRight className="size-3" strokeWidth={2.5} />}
                {Math.abs(delta)}
                %
              </span>
            )
          : hint != null
            ? <span className="truncate text-[11px] text-muted">{hint}</span>
            : null}
      </div>
    </div>
  );
}
