import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authorizeQueryOptions } from "~react/queries/auth";

export const Route = createFileRoute("/_dashboard/users")({
  component: UsersLayout,
  beforeLoad: async ({ context }) => {
    const canList = await context.queryClient.ensureQueryData(authorizeQueryOptions("user:list"));

    if (!canList) {
      throw redirect({ to: "/" });
    }
  },
  loader: () => ({
    crumb: "pages.users.title",
  }),
});

function UsersLayout() {
  return <Outlet />;
}
