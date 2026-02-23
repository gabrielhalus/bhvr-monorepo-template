import type { UserPreferences } from "~shared/schemas/db/users.schemas";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useUpdatePreferences } from "@/hooks/preferences/use-update-preferences";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { auth } from "@/lib/auth";
import { authQueryOptions } from "~react/queries/auth";
import { SidebarInset, SidebarProvider } from "~react/components/sidebar";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
  beforeLoad: async () => await auth(),
  staticData: { crumb: "pages.home.title" },
});

function DashboardLayout() {
  const { data: session } = useQuery(authQueryOptions);
  const { setTheme } = useTheme();
  const { i18n } = useTranslation();
  const { mutate: updatePreferences } = useUpdatePreferences();

  const preferences = (session?.user?.preferences ?? null) as UserPreferences;

  useEffect(() => {
    if (preferences?.theme) setTheme(preferences.theme);
    if (preferences?.locale) i18n.changeLanguage(preferences.locale);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePreferenceChange = (prefs: { sidebarOpen: boolean }) => {
    updatePreferences(prefs);
  };

  return (
    <SidebarProvider
      defaultOpen={preferences?.sidebarOpen ?? true}
      onPreferenceChange={handlePreferenceChange}
    >
      <AppSidebar />
      <SidebarInset>
        <ImpersonationBanner />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
