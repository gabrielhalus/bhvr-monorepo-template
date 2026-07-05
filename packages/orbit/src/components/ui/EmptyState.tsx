import type { IconComponent } from "~orbit/components/ui/icons";

import { Sparkle } from "~orbit/components/ui/Sparkle";
import { cn } from "~orbit/lib/utils";

/** Centered placeholder for empty lists, boards or search results. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: IconComponent;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "dot-grid relative flex flex-col items-center overflow-hidden rounded-xl border border-line bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <div className="relative mb-5 grid size-16 place-items-center rounded-2xl border border-line bg-surface-2 shadow-soft">
        {Icon
          ? (
              <Icon className="size-7 text-faint" strokeWidth={1.75} aria-hidden />
            )
          : (
              <Sparkle className="size-7 text-accent-deep" aria-hidden />
            )}
        <Sparkle className="absolute -right-2 -top-2 size-4 text-amber" aria-hidden />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-balance text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
