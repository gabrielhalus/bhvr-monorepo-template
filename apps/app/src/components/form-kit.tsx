import { Badge } from "~orbit/components/ui/Badge";
import { Check } from "~orbit/components/ui/icons";
import { Panel } from "~orbit/components/ui/Panel";
import { cn } from "~orbit/lib/utils";

/**
 * Shared form primitives (Orbit-styled) used across the create/edit forms:
 * numbered sections, labelled field groups and responsive field grids.
 */

export function FormSection({
  index,
  title,
  sub,
  req,
  opt,
  done,
  flush,
  actions,
  children,
}: {
  index: React.ReactNode;
  title: React.ReactNode;
  sub?: string;
  req?: string;
  opt?: string;
  /** Mark the section complete — the number badge becomes a green check. */
  done?: boolean;
  /** Drop body padding (for edge-to-edge tables). */
  flush?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-start gap-3">
          <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg font-mono text-[12px] font-semibold [&_svg]:size-3.5", done ? "bg-sage text-white" : "bg-surface-2 text-muted")}>
            {done ? <Check className="size-3.5" /> : index}
          </span>
          <div>
            <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
              {title}
              {req && <Badge tone="coral">{req}</Badge>}
              {opt && <Badge tone="neutral">{opt}</Badge>}
            </h3>
            {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
          </div>
        </div>
        {actions}
      </div>
      <div className={cn(!flush && "p-5")}>{children}</div>
    </Panel>
  );
}

export function FieldGrid({ cols = 2, children }: { cols?: 2 | 3; children: React.ReactNode }) {
  return <div className={cn("grid gap-3", cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>{children}</div>;
}

/** Section footer bar: muted note on the left, actions on the right. */
export function SecFoot({ note, className, children }: { note?: React.ReactNode; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-2/40 px-5 py-3.5", className)}>
      {note != null ? <span className="text-[11px] text-muted">{note}</span> : <span />}
      {children != null && <div className="flex items-center gap-1.5">{children}</div>}
    </div>
  );
}

export function Fg({
  label,
  req,
  hint,
  span2,
  htmlFor,
  children,
}: {
  label: string;
  req?: boolean;
  hint?: string;
  span2?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", span2 && "sm:col-span-2")}>
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
        {label}
        {req && <span className="size-1.5 rounded-full bg-coral" />}
        {hint && <span className="ml-auto text-[11px] font-normal text-faint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
