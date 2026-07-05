import * as RProgress from "@radix-ui/react-progress";

import { cn } from "~orbit/lib/utils";

type Tone = "accent" | "amber" | "coral" | "sage" | "ink";

const barTone: Record<Tone, string> = {
  accent: "bg-accent",
  amber: "bg-amber",
  coral: "bg-coral",
  sage: "bg-sage",
  ink: "bg-ink",
};

const strokeTone: Record<Tone, string> = {
  accent: "stroke-accent",
  amber: "stroke-amber",
  coral: "stroke-coral",
  sage: "stroke-sage",
  ink: "stroke-ink",
};

export function Progress({
  value,
  tone = "accent",
  className,
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <RProgress.Root
      value={v}
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-pill bg-surface-2",
        className,
      )}
    >
      <RProgress.Indicator
        className={cn(
          "size-full rounded-pill transition-transform duration-700 ease-out-expo",
          barTone[tone],
        )}
        style={{ transform: `translateX(-${100 - v}%)` }}
      />
    </RProgress.Root>
  );
}

/** Segmented "battery" progress, echoing the habit trackers in the refs. */
export function SegmentBar({
  value,
  total = 12,
  tone = "coral",
}: {
  value: number;
  total?: number;
  tone?: Tone;
}) {
  return (
    <div className="flex items-center gap-0.75">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-4 w-1.25 rounded-full transition-colors",
            i < value ? barTone[tone] : "bg-line",
          )}
        />
      ))}
    </div>
  );
}

export function Ring({
  value,
  size = 88,
  stroke = 9,
  tone = "accent",
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
  label?: string;
  sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="stroke-surface-2"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={cn(strokeTone[tone], "transition-[stroke-dashoffset] duration-1000 ease-out-expo")}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute text-center leading-none">
        <div className="font-display text-lg font-bold">{label ?? `${value}%`}</div>
        {sublabel && <div className="mt-0.5 font-mono text-[10px] uppercase text-muted">{sublabel}</div>}
      </div>
    </div>
  );
}
