import { CalendarClock, CheckSquare, FolderKanban, Home } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

const items = [
  { icon: Home, label: "Accueil", active: true },
  { icon: FolderKanban, label: "Projets" },
  { icon: CheckSquare, label: "Tâches" },
  { icon: CalendarClock, label: "Agenda" },
];

/** Floating bottom navigation for the mobile shell — clean light style. */
export function MobileBar({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        "flex items-center justify-around gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-raised",
        className,
      )}
    >
      {items.map(it => (
        <button
          key={it.label}
          className={cn(
            "flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[12px] font-medium transition-colors",
            it.active ? "bg-accent text-white" : "text-faint hover:text-ink",
          )}
        >
          <it.icon className="size-4.5" strokeWidth={2} />
          {it.active && <span>{it.label}</span>}
        </button>
      ))}
    </nav>
  );
}
