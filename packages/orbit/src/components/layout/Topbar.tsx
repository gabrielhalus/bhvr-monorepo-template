import { Button } from "~orbit/components/ui/Button";
import { Bell, Plus, Search } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

/** Product top bar: greeting, search, quick actions. */
export function Topbar({ className }: { className?: string }) {
  return (
    <header className={cn("flex items-center justify-between gap-4", className)}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Salut, Gabriel
          {" "}
          <span className="text-accent-deep">✦</span>
        </h2>
        <p className="text-sm text-muted">
          3 projets actifs · 5 tâches dues aujourd'hui
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            placeholder="Rechercher…"
            className="h-10 w-56 rounded-lg border border-line bg-surface pl-10 pr-4 text-sm placeholder:text-faint focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
          />
        </div>
        <Button variant="outline" size="icon" aria-label="Notifications">
          <span className="relative">
            <Bell className="size-4.5" />
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-coral ring-2 ring-surface" />
          </span>
        </Button>
        <Button>
          <Plus className="size-4" strokeWidth={2.5} />
          {" "}
          Nouveau
        </Button>
      </div>
    </header>
  );
}
