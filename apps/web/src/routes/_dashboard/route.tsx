import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { auth } from "@/lib/auth";
import { Separator } from "~react/components/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~react/components/sidebar";
import { getDefaultConfigValue } from "~shared/helpers";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
  beforeLoad: async () => {
    const session = await auth();
    const register = getDefaultConfigValue("authentication.register");

    return { session, register };
  },
  loader: () => {
    return {
      crumb: "pages.home.title",
    };
  },
});

function DashboardLayout() {
  const { register } = Route.useRouteContext();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b-1">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumbs />
            {JSON.stringify(register, null, 2)}
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
