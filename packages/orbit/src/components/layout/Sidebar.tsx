import { Avatar } from "~orbit/components/ui/Avatar";
import {
  Bug,
  CalendarClock,
  CheckSquare,
  ChevronRight,
  ChevronsLeft,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  MessageCircle,
  MessageSquare,
  Search,
  Settings,
  StickyNote,
  Users,
  UsersRound,
  Zap,
} from "~orbit/components/ui/icons";
import { Sparkle } from "~orbit/components/ui/Sparkle";
import { cn } from "~orbit/lib/utils";

type NavItem = {
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
  badge?: number;
};

const mainNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", active: true },
  { icon: FolderKanban, label: "Projets" },
  { icon: Users, label: "Clients" },
  { icon: UsersRound, label: "Collaborateurs" },
  { icon: MessageSquare, label: "Messages", badge: 33 },
];

const toolsNav: NavItem[] = [
  { icon: CheckSquare, label: "Tâches", badge: 12 },
  { icon: Bug, label: "Bugs", badge: 3 },
  { icon: StickyNote, label: "Notes" },
  { icon: CalendarClock, label: "Meetings" },
];

const workspaceNav = [
  { dot: "bg-accent", label: "Studio Mira", badge: 5 },
  { dot: "bg-coral", label: "Atelier Nord", badge: 4 },
];

function NavLink({ item }: { item: NavItem }) {
  return (
    <a
      href="#"
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
        item.active
          ? "bg-surface-2 text-ink"
          : "text-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      <item.icon
        className={cn("size-4.5", item.active ? "text-accent" : "text-faint group-hover:text-muted")}
        strokeWidth={2}
      />
      <span className="flex-1">{item.label}</span>
      {item.badge != null && (
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
            item.active ? "bg-accent-soft text-accent" : "bg-surface-2 text-faint group-hover:bg-surface",
          )}
        >
          {item.badge}
        </span>
      )}
    </a>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-faint">
      {children}
    </div>
  );
}

/**
 * Product navigation rail — clean SaaS sidebar.
 *  `variant`: `card` (floating, rounded) · `flush` (edge-anchored).
 */
export function Sidebar({
  className,
  variant = "card",
}: {
  className?: string;
  variant?: "card" | "flush";
}) {
  return (
    <aside
      className={cn(
        "flex w-64 shrink-0 flex-col bg-surface p-3",
        variant === "card"
          ? "rounded-xl border border-line shadow-soft"
          : "border-r border-line",
        className,
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink text-accent">
          <Sparkle className="size-5" />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-semibold">Orbit Inc.</div>
          <div className="truncate text-[11px] text-faint">Plan Studio</div>
        </div>
        <button
          aria-label="Réduire"
          className="grid size-7 place-items-center rounded-md text-faint transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <ChevronsLeft className="size-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <input
          placeholder="Rechercher…"
          className="h-9 w-full rounded-lg border border-line bg-surface-2 pl-9 pr-12 text-[13px] placeholder:text-faint focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/15"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-faint">
          ⌘K
        </kbd>
      </div>

      {/* Nav */}
      <nav className="mt-1 flex-1 overflow-y-auto">
        <GroupLabel>Menu principal</GroupLabel>
        <div className="space-y-0.5">
          {mainNav.map(item => (
            <NavLink key={item.label} item={item} />
          ))}
        </div>

        <GroupLabel>Outils</GroupLabel>
        <div className="space-y-0.5">
          {toolsNav.map(item => (
            <NavLink key={item.label} item={item} />
          ))}
        </div>

        <GroupLabel>Workspace</GroupLabel>
        <div className="space-y-0.5">
          {workspaceNav.map(item => (
            <a
              key={item.label}
              href="#"
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <span className={cn("size-2 shrink-0 rounded-full", item.dot)} />
              <span className="flex-1 truncate">{item.label}</span>
              <span className="text-[11px] font-semibold text-faint">{item.badge}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* Footer links */}
      <div className="mt-2 space-y-0.5 border-t border-line pt-2">
        {[
          { icon: Settings, label: "Réglages" },
          { icon: LifeBuoy, label: "Aide" },
          { icon: MessageCircle, label: "Feedback" },
        ].map(l => (
          <a
            key={l.label}
            href="#"
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <l.icon className="size-4.5 text-faint group-hover:text-muted" strokeWidth={2} />
            {l.label}
          </a>
        ))}
      </div>

      {/* Upgrade card */}
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-line brand-gradient p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-white shadow-accent">
          <Zap className="size-4.5" fill="currentColor" />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-semibold">Passez au Pro</div>
          <div className="truncate text-[11px] text-muted">Débloquez tout</div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted" />
      </div>

      {/* User */}
      <div className="mt-2 flex items-center gap-3 rounded-lg px-1 py-1.5">
        <Avatar name="Gabriel Halus" size="sm" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-semibold">Gabriel Halus</div>
          <div className="truncate text-[11px] text-faint">gabriel@orbit.com</div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-faint" />
      </div>
    </aside>
  );
}
