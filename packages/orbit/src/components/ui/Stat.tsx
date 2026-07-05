import { ArrowDownRight, ArrowUpRight } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

/** Compact metric tile used across dashboards. */
export function Stat({
  label,
  value,
  unit,
  delta,
  icon,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  icon?: React.ReactNode;
  className?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted">
          {label}
        </span>
        {icon && <span className="text-faint">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="font-display text-[28px] font-bold leading-none tracking-tight">
          {value}
        </span>
        {unit && <span className="pb-0.5 text-sm text-muted">{unit}</span>}
      </div>
      {delta !== undefined && (
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-semibold",
            up ? "bg-sage-soft text-[#15803d]" : "bg-coral-soft text-[#c0383c]",
          )}
        >
          {up
            ? (
                <ArrowUpRight className="size-3" strokeWidth={2.5} />
              )
            : (
                <ArrowDownRight className="size-3" strokeWidth={2.5} />
              )}
          {Math.abs(delta)}
          %
        </div>
      )}
    </div>
  );
}
