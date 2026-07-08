import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useMatchRoute, useNavigate } from "@tanstack/react-router";

import { authQueryOptions, logout } from "@/queries/auth";
import { Avatar } from "~orbit/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~orbit/components/ui/DropdownMenu";
import {
  Building2,
  Flag,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings2,
  Users,
} from "~orbit/components/ui/icons";
import { Sparkle } from "~orbit/components/ui/Sparkle";
import { cn } from "~orbit/lib/utils";

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;

type AdminNavLink = { to: string; label: string; icon: IconComponent };

const NAV_LINKS: AdminNavLink[] = [
  { to: "/", label: "Vue d'ensemble", icon: LayoutDashboard },
  { to: "/organizations", label: "Organisations", icon: Building2 },
  { to: "/users", label: "Utilisateurs", icon: Users },
  { to: "/flags", label: "Feature flags", icon: Flag },
  { to: "/configs", label: "Configuration", icon: Settings2 },
  { to: "/logs", label: "Journal d'audit", icon: ScrollText },
];

/**
 * Desktop navigation rail of the platform admin — mirrors the tenant app's
 * Orbit house style (flush rail, grouped nav, user row).
 */
export function AdminSidebar() {
  return (
    <aside className="flex h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface p-3">
      <BrandMark />

      <nav className="mt-1 flex-1 overflow-y-auto">
        <GroupLabel>Plateforme</GroupLabel>
        <div className="space-y-0.5">
          {NAV_LINKS.map(link => (
            <NavItem key={link.to} link={link} />
          ))}
        </div>
      </nav>

      <div className="mt-2 border-t border-line pt-2">
        <UserRow />
      </div>
    </aside>
  );
}

function BrandMark() {
  return (
    <Link to="/" aria-label="Administration bunstack" className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
      <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink text-accent">
        <Sparkle className="size-5" />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-sm font-semibold text-ink">bunstack</div>
        <div className="truncate font-mono text-[11px] uppercase tracking-wider text-faint">Admin</div>
      </div>
    </Link>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1.5 pt-4 font-mono text-[11px] font-semibold uppercase tracking-wider text-faint">
      {children}
    </div>
  );
}

function NavItem({ link }: { link: AdminNavLink }) {
  const matchRoute = useMatchRoute();
  const Icon = link.icon;
  const isActive = link.to === "/"
    ? !!matchRoute({ to: "/", fuzzy: false })
    : !!matchRoute({ to: link.to, fuzzy: true });

  return (
    <Link
      to={link.to}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
        isActive ? "bg-surface-2 text-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      <Icon
        className={cn("size-4.5 shrink-0", isActive ? "text-accent" : "text-faint group-hover:text-muted")}
        strokeWidth={2}
      />
      <span className="flex-1 truncate">{link.label}</span>
    </Link>
  );
}

function UserRow() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useQuery(authQueryOptions);

  if (!session) return null;

  const fullName = `${session.user.firstName} ${session.user.lastName}`;

  async function onLogout() {
    await logout();
    queryClient.setQueryData(authQueryOptions.queryKey, null);
    navigate({ to: "/login", search: { redirect: undefined } });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-surface-2 focus:outline-none focus:ring-4 focus:ring-accent/15">
        <Avatar name={fullName} size="sm" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-semibold capitalize text-ink">{fullName}</div>
          <div className="truncate text-[11px] text-faint">{session.user.email}</div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-60">
        <div className="px-2.5 py-1.5 leading-tight">
          <div className="truncate text-sm font-medium capitalize text-ink">{fullName}</div>
          <div className="truncate text-xs text-muted">{session.user.email}</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger" onClick={onLogout}>
          <LogOut />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
