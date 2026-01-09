import { createFileRoute, Outlet } from "@tanstack/react-router";

import { auth } from "@/lib/auth";
import { getRuntimeConfigQueryOptions } from "@/queries/runtime-configs";
import { inferConfigValue } from "~shared/helpers/infer-config-value";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  beforeLoad: async ({ context }) => {
    await auth({ redirectOnAuthenticated: true, redirectOnUnauthenticated: false });

    const { value: config } = await context.queryClient.ensureQueryData(getRuntimeConfigQueryOptions("authentication.00_disableRegister"));
    return { disableRegister: inferConfigValue(config.value!) };
  },
});

function AuthLayout() {
  return <Outlet />;
}
