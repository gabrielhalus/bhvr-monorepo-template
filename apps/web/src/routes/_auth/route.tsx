import { createFileRoute, Outlet } from "@tanstack/react-router";

import { auth } from "@bunstack/web/lib/auth";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  beforeLoad: async () => {
    await auth({ redirectOnAuthenticated: true, redirectOnUnauthenticated: false });
  },
});

function AuthLayout() {
  return <Outlet />;
}
