import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { auth } from "@/lib/auth";
import { SidebarInset, SidebarProvider } from "~react/components/sidebar";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
  beforeLoad: async () => await auth({ redirectOnUnauthenticated: false }),
  staticData: { crumb: "pages.home.title" },
});

function DashboardLayout() {
  // TODO: implement preference saving (e.g., persist to user profile or localStorage)
  const handlePreferenceChange = (_prefs: { sidebarOpen: boolean }) => {
    // Will be implemented by the user
  };

  return (
    <SidebarProvider onPreferenceChange={handlePreferenceChange}>
      <AppSidebar />
      <SidebarInset>
        <ImpersonationBanner />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
