import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { auth } from "@/lib/auth";
import { Separator } from "~react/components/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~react/components/sidebar";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
  beforeLoad: async () => await auth(),
  staticData: { crumb: "pages.home.title" },
});

function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <ImpersonationBanner />
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4 opacity-50" />
            <Breadcrumbs />
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
