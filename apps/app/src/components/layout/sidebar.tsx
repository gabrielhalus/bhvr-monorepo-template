import type { UserPreferences } from "~shared/schemas/db/users.schemas";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useUpdatePreferences } from "@/hooks/preferences/use-update-preferences";
import { useAuth } from "@/hooks/use-auth";
import { useNavLinks } from "@/hooks/use-nav-links";
import { ChevronsLeft, ChevronsRight } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

import {
  BrandMark,
  GroupLabel,
  NavItem,
  SearchTrigger,
  SidebarUserTrigger,
  UserMenu,
} from "./nav-shared";

type SidebarProps = { onOpenPalette?: () => void };

/**
 * Desktop navigation rail — Orbit house style, driven by real auth + branding.
 *  Collapses to an icon rail via the brand-row chevron; state persists in preferences.
 */
export function Sidebar({ onOpenPalette }: SidebarProps) {
  const { t } = useTranslation("web");
  const { links, adminLinks } = useNavLinks();
  const { user, authenticated } = useAuth();
  const { mutate: updatePreferences } = useUpdatePreferences();
  const [collapsed, setCollapsed] = useState(
    () => (user.preferences as UserPreferences)?.sidebarOpen === false,
  );

  if (!authenticated) return null;

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      // Persist as `sidebarOpen` (true = expanded) in the background.
      updatePreferences({ sidebarOpen: !next });
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "flex h-dvh shrink-0 flex-col border-r border-line bg-surface p-3 transition-[width] duration-200 ease-out-expo",
        collapsed ? "w-18" : "w-64",
      )}
    >
      <BrandMark collapsed={collapsed} />

      <SearchTrigger onOpenPalette={onOpenPalette} collapsed={collapsed} className={cn("mt-3", collapsed && "self-center")} />

      {/* Nav */}
      <nav className="mt-1 flex-1 overflow-y-auto">
        {collapsed ? <div className="pt-4" /> : <GroupLabel>{t("nav.menu" as never, { defaultValue: "Menu" })}</GroupLabel>}
        <div className="space-y-0.5">
          {links.map(link => (
            <NavItem key={String(link.to)} link={link} label={t(link.label as never)} collapsed={collapsed} />
          ))}
        </div>

        {adminLinks.length > 0 && (
          <>
            {collapsed
              ? <div className="my-2 border-t border-line" />
              : <GroupLabel>{t("nav.administration" as never)}</GroupLabel>}
            <div className="space-y-0.5">
              {adminLinks.map(link => (
                <NavItem key={String(link.to)} link={link} label={t(link.label as never)} collapsed={collapsed} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={t(collapsed ? "nav.expand" : "nav.collapse")}
        title={t(collapsed ? "nav.expand" : "nav.collapse")}
        className={cn(
          "mt-2 flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink focus:outline-none focus:ring-4 focus:ring-accent/15",
          collapsed ? "w-9 justify-center self-center px-0" : "w-full",
        )}
      >
        {collapsed
          ? <ChevronsRight className="size-4.5 shrink-0" strokeWidth={2} />
          : <ChevronsLeft className="size-4.5 shrink-0" strokeWidth={2} />}
        {!collapsed && <span className="flex-1 text-left">{t("nav.collapse")}</span>}
      </button>

      {/* User */}
      <div className="mt-2 border-t border-line pt-2">
        <UserMenu side="top" align="end">
          <SidebarUserTrigger collapsed={collapsed} />
        </UserMenu>
      </div>
    </aside>
  );
}
