import { cn } from "~orbit/lib/utils";

/**
 * Panel — the workspace counterpart to Card.
 *
 * Where Card floats (rounded-xl, shadow, gaps), a Panel is *flat*: a hairline-
 * bordered region meant to sit flush against its neighbours on a workspace
 * canvas. Compose `Panel` > `PanelHeader` (mono label + divider) > `PanelBody`.
 * Stack panels with `divide-line` or `border` instead of spacing them apart.
 */

type Tone = "surface" | "sunken" | "ink";

const tones: Record<Tone, string> = {
  surface: "bg-surface text-ink border-line",
  sunken: "bg-paper-2 text-ink border-line",
  ink: "bg-ink text-paper border-line-ink",
};

export function Panel({
  children,
  tone = "surface",
  bordered = true,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  tone?: Tone;
  /** Draw the surrounding hairline. Turn off when nesting inside a divided grid. */
  bordered?: boolean;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-lg",
        tones[tone],
        bordered && "border",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  label,
  icon,
  actions,
  tone = "surface",
  className,
}: {
  label: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-11 shrink-0 items-center justify-between gap-3 border-b px-4",
        tone === "ink" ? "border-line-ink" : "border-line",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider",
          tone === "ink" ? "text-paper/60" : "text-faint",
        )}
      >
        {icon}
        {label}
      </span>
      {actions}
    </div>
  );
}

export function PanelBody({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 flex-1 p-4", className)}>{children}</div>;
}
