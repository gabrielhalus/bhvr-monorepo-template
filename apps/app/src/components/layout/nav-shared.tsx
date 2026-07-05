import type { NavLink } from "@/hooks/use-nav-links";

import { Link, useMatchRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { userAvatarUrl } from "@/api/account/account.api";
import { useAuth } from "@/hooks/use-auth";
import { useBranding } from "@/hooks/use-branding";
import { Avatar } from "~orbit/components/ui/Avatar";
import { Badge } from "~orbit/components/ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~orbit/components/ui/DropdownMenu";
import {
  ChevronDown,
  Search,
  Shield,
} from "~orbit/components/ui/icons";
import { Sparkle } from "~orbit/components/ui/Sparkle";
import { Tooltip, TooltipContent, TooltipTrigger } from "~orbit/components/ui/Tooltip";
import { cn } from "~orbit/lib/utils";

import { AccountMenuItems } from "./account-menu-items";

export const ENV = (import.meta.env.MODE === "production"
  ? "PROD"
  : import.meta.env.MODE === "development"
    ? "DEV"
    : import.meta.env.MODE
).toUpperCase();

/**
 * Brand lockup — logo (or sparkle fallback) + app name + environment tag.
 *  `compact` hides the text block below `sm` for the horizontal navbar;
 *  `collapsed` reduces it to the logo alone for the icon rail.
 */
export function BrandMark({
  compact = false,
  collapsed = false,
  className,
}: {
  compact?: boolean;
  collapsed?: boolean;
  className?: string;
}) {
  const branding = useBranding();

  return (
    <Link
      to="/"
      aria-label={branding.appName}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2 py-1.5",
        compact && "shrink-0 px-1",
        collapsed && "justify-center px-0",
        className,
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink text-accent">
        {branding.logoUrl
          ? <img src={branding.logoUrl} alt={branding.appName} className="size-full object-cover" />
          : <Sparkle className="size-5" />}
      </span>
      <div className={cn("min-w-0 flex-1 leading-tight", compact && "hidden sm:block", collapsed && "hidden")}>
        <div className="truncate text-sm font-semibold text-ink">{branding.appName}</div>
        <div className="truncate font-mono text-[11px] uppercase tracking-wider text-faint">{ENV}</div>
      </div>
    </Link>
  );
}

/**
 * Search affordance that opens the command palette. Forwards `className` so
 *  callers can size it (full-width rail vs. fixed-width navbar slot); `collapsed`
 *  renders an icon-only button for the icon rail.
 */
export function SearchTrigger({
  onOpenPalette,
  className,
  collapsed = false,
}: {
  onOpenPalette?: () => void;
  className?: string;
  collapsed?: boolean;
}) {
  const { t } = useTranslation("web");
  const placeholder = t("cmdPalette.placeholder" as never);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onOpenPalette}
        aria-label={placeholder}
        title={placeholder}
        className={cn(
          "flex size-9 items-center justify-center rounded-lg border border-line bg-surface-2 text-faint transition-colors hover:bg-surface hover:text-muted focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/15",
          className,
        )}
      >
        <Search className="size-4 shrink-0" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenPalette}
      className={cn(
        "flex h-9 w-full items-center gap-2.5 rounded-lg border border-line bg-surface-2 pl-3 pr-2 text-[13px] text-faint transition-colors hover:bg-surface focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/15",
        className,
      )}
    >
      <Search className="size-4 shrink-0" />
      <span className="flex-1 truncate text-left">{placeholder}</span>
      <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-faint">⌘K</kbd>
    </button>
  );
}

/**
 * User dropdown (account header + shared account actions). The caller supplies
 *  the trigger via `children` (`asChild`) — a full row in the rail, an avatar in the bar.
 */
export function UserMenu({
  side = "top",
  align = "end",
  children,
}: {
  side?: "top" | "bottom";
  align?: "start" | "end";
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className="w-60">
        <div className="px-2.5 py-1.5 leading-tight">
          <div className="truncate text-sm font-medium capitalize text-ink">{fullName}</div>
          <div className="truncate text-xs text-muted">{user.email}</div>
        </div>
        <DropdownMenuSeparator />
        <AccountMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * A single navigation entry. `orientation` switches between the rail's
 *  full-width rows and the navbar's inline pills; `collapsed` renders an
 *  icon-only row with the label surfaced through a tooltip.
 */
export function NavItem({
  link,
  label,
  badge,
  orientation = "vertical",
  collapsed = false,
}: {
  link: NavLink;
  label: string;
  badge?: number;
  orientation?: "vertical" | "horizontal";
  collapsed?: boolean;
}) {
  const matchRoute = useMatchRoute();
  const Icon = link.icon;
  const isActive = link.to === "/"
    ? !!matchRoute({ to: "/", fuzzy: false })
    : !!matchRoute({ to: link.to as string, fuzzy: true });

  const item = (
    <Link
      to={link.to}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
        orientation === "horizontal" && "shrink-0 gap-2",
        collapsed && "justify-center px-0",
        isActive ? "bg-surface-2 text-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      <Icon
        className={cn("size-4.5 shrink-0", isActive ? "text-accent" : "text-faint group-hover:text-muted")}
        strokeWidth={2}
      />
      {!collapsed && <span className={cn("truncate", orientation === "vertical" && "flex-1")}>{label}</span>}
      {badge != null && (collapsed
        ? <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-coral ring-2 ring-surface" aria-hidden />
        : <Badge tone="coral" className="px-1.5 py-0.5 text-[11px]">{badge > 9 ? "9+" : badge}</Badge>)}
    </Link>
  );

  if (!collapsed) return item;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{item}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Administration links as a compact icon dropdown — sits in the navbar's
 *  trailing actions. The trigger glows accent when any admin route is active.
 */
export function AdminMenu({ links }: { links: NavLink[] }) {
  const { t } = useTranslation("web");
  const matchRoute = useMatchRoute();
  const label = t("nav.administration" as never);
  const isActive = links.some(link => !!matchRoute({ to: link.to as string, fuzzy: true }));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        title={label}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 transition-colors hover:bg-surface hover:text-muted focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/15 data-[state=open]:bg-surface data-[state=open]:text-ink",
          isActive ? "text-accent" : "text-faint",
        )}
      >
        <Shield className="size-4.5" strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {links.map((link) => {
          const Icon = link.icon;
          const active = !!matchRoute({ to: link.to as string, fuzzy: true });
          return (
            <DropdownMenuItem key={String(link.to)} asChild className={cn(active && "bg-surface-2")}>
              <Link to={link.to}>
                <Icon className={cn(active ? "text-accent" : "text-faint")} />
                {t(link.label as never)}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Secondary links dropdown for the navbar — collects non-primary pages behind
 * a "Plus ▾" trigger so the primary nav stays uncluttered.
 */
export function MoreMenu({ links }: { links: (NavLink & { badge?: number })[] }) {
  const { t } = useTranslation("web");
  const matchRoute = useMatchRoute();
  const label = t("nav.more" as never);
  const isActive = links.some(link =>
    link.to === "/" ? !!matchRoute({ to: "/", fuzzy: false }) : !!matchRoute({ to: link.to as string, fuzzy: true }),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors hover:bg-surface-2 hover:text-ink focus:outline-none focus:ring-4 focus:ring-accent/15 data-[state=open]:bg-surface-2 data-[state=open]:text-ink",
          isActive ? "bg-surface-2 text-ink" : "text-muted",
        )}
      >
        {label}
        <ChevronDown className="size-3.5 text-faint" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {links.map((link) => {
          const Icon = link.icon;
          const active = link.to === "/"
            ? !!matchRoute({ to: "/", fuzzy: false })
            : !!matchRoute({ to: link.to as string, fuzzy: true });
          return (
            <DropdownMenuItem key={String(link.to)} asChild className={cn(active && "bg-surface-2")}>
              <Link to={link.to}>
                <Icon className={cn(active ? "text-accent" : "text-faint")} />
                <span className="flex-1">{t(link.label as never)}</span>
                {link.badge != null && (
                  <Badge tone="coral" className="px-1.5 py-0.5 text-[11px]">
                    {link.badge > 9 ? "9+" : link.badge}
                  </Badge>
                )}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Avatar lockup used as the user-menu trigger inside the rail. Forwards props
 *  and ref so it can back a Radix `asChild` trigger; `collapsed` shows the
 *  avatar alone.
 */
export function SidebarUserTrigger({ ref, collapsed = false, className, ...props }: React.ComponentPropsWithoutRef<"button"> & { collapsed?: boolean } & { ref?: React.RefObject<HTMLButtonElement | null> }) {
  const { user } = useAuth();
  const { t } = useTranslation("web");
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={collapsed ? fullName : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-surface-2 focus:outline-none focus:ring-4 focus:ring-accent/15",
        collapsed && "justify-center px-0",
        className,
      )}
      {...props}
    >
      <Avatar name={fullName} size="sm" src={userAvatarUrl(user.avatar, user.updatedAt) ?? undefined} />
      {!collapsed && (
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-semibold capitalize text-ink">{fullName}</div>
          <div className="truncate text-[11px] text-faint">
            {t(`roles.names.${user.roles[0]?.name}` as never)}
          </div>
        </div>
      )}
    </button>
  );
}
SidebarUserTrigger.displayName = "SidebarUserTrigger";

/** Uppercase section label for grouping rail navigation. */
export function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1.5 pt-4 font-mono text-[11px] font-semibold uppercase tracking-wider text-faint">
      {children}
    </div>
  );
}
