import type { UserMetadata, UserPreferences } from "~shared/schemas/db/users.schemas";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { CommandPalette } from "@/components/command-palette";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { auth } from "@/lib/auth";
import { authQueryOptions } from "@/queries/auth";
import { AppShell, AppShellMain, AppShellMobileBar, AppShellSidebar } from "~orbit/components/layout/AppShell";
import { cn } from "~orbit/lib/utils";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
  beforeLoad: async ({ location }) => {
    const session = await auth();
    const metadata = session?.user?.metadata as UserMetadata | null;
    if (metadata?.mustChangePassword && !location.pathname.startsWith("/account")) {
      throw redirect({ to: "/account" });
    }
  },
  staticData: { crumb: "home.title" },
});

function DashboardLayout() {
  const { data: session } = useQuery(authQueryOptions);
  const { setTheme } = useTheme();
  const { i18n } = useTranslation();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const preferences = (session?.user?.preferences ?? null) as UserPreferences;
  const navLayout = preferences?.navLayout ?? "sidebar";

  useEffect(() => {
    // Orbit is light-only — pin the theme to light regardless of any stored preference.
    setTheme("light");
    if (preferences?.locale) i18n.changeLanguage(preferences.locale);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isNavbar = navLayout === "navbar";

  return (
    <AppShell className={cn(isNavbar && "flex-col")}>
      {isNavbar
        ? (
            <div className="sticky top-0 z-30 hidden lg:block">
              <Navbar onOpenPalette={() => setPaletteOpen(true)} />
            </div>
          )
        : (
            <AppShellSidebar>
              <Sidebar onOpenPalette={() => setPaletteOpen(true)} />
            </AppShellSidebar>
          )}

      <AppShellMain data-scroll-restoration-id="main">
        <ImpersonationBanner />
        <Outlet />
      </AppShellMain>

      <AppShellMobileBar>
        <MobileNav />
      </AppShellMobileBar>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </AppShell>
  );
}
