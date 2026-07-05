import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authorizeBatchQueryOptions } from "@/queries/auth";

export const Route = createFileRoute("/_dashboard/users")({
  component: UsersLayout,
  beforeLoad: async ({ context }) => {
    const results = await context.queryClient.ensureQueryData(
      authorizeBatchQueryOptions([{ permission: "user:list" }]),
    );

    if (!results[0]) {
      throw redirect({ to: "/" });
    }
  },
  staticData: { crumb: "users.title" },
});

function UsersLayout() {
  return <Outlet />;
}
