import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AdminSidebar } from "@/components/layout/sidebar";
import { authQueryOptions } from "@/queries/auth";
import { AppShell, AppShellMain, AppShellSidebar } from "~orbit/components/layout/AppShell";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authQueryOptions);

    if (!session) {
      throw redirect({ to: "/login", search: { redirect: window.location.href }, replace: true });
    }

    // Platform surface: only users holding a platform role belong here
    const hasPlatformRole = session.user.roles.some(role => role.organizationId === null);
    if (!hasPlatformRole) {
      throw redirect({ to: "/login", search: { redirect: undefined }, replace: true });
    }

    return { session };
  },
});

function DashboardLayout() {
  return (
    <AppShell>
      <AppShellSidebar>
        <AdminSidebar />
      </AppShellSidebar>

      <AppShellMain data-scroll-restoration-id="main">
        <Outlet />
      </AppShellMain>
    </AppShell>
  );
}
