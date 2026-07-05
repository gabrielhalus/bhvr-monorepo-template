import { Fragment } from "react";

import { cn } from "~orbit/lib/utils";

/** Shared detail-page scaffolding (Orbit-styled): two-column form layout + sidebar cards. */

export function FormLayout({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_380px]", className)} {...props} />;
}

export function FormStack({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-3", className)} {...props} />;
}

export function FormSide({ className, ...props }: React.ComponentProps<"div">) {
  return <aside className={cn("flex flex-col gap-3 lg:sticky lg:top-18", className)} {...props} />;
}

export function SideCard({ icon, title, tone = "default", className, children }: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  tone?: "default" | "danger";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border p-5 shadow-soft", tone === "danger" ? "border-coral/30 bg-surface" : "border-line bg-surface", className)}>
      <div className={cn("mb-3.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] [&_svg]:size-3.5", tone === "danger" ? "text-coral-deep" : "text-faint")}>
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

export type SideStat = { k: React.ReactNode; v: React.ReactNode; mono?: boolean; tone?: "green" };

export function SideStats({ rows }: { rows: SideStat[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2.5 text-xs">
      {rows.map((r, i) => (
        <Fragment key={i}>
          <dt className="text-muted">{r.k}</dt>
          <dd className={cn("min-w-0 truncate text-right font-medium text-ink", r.mono && "font-mono text-[11px] tracking-normal", r.tone === "green" && "text-sage")}>{r.v}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
