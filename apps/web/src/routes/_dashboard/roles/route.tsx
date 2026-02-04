import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authorizeQueryOptions } from "~react/queries/auth";

export const Route = createFileRoute("/_dashboard/roles")({
  beforeLoad: async ({ context }) => {
    const canList = await context.queryClient.ensureQueryData(authorizeQueryOptions("role:list"));

    if (!canList) {
      throw redirect({ to: "/" });
    }
  },
  component: RolesLayout,
  staticData: { crumb: "pages.roles.title" },
});

function RolesLayout() {
  return <Outlet />;
}
