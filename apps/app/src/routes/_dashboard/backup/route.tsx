import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authorizeBatchQueryOptions } from "@/queries/auth";

export const Route = createFileRoute("/_dashboard/backup")({
  component: () => <Outlet />,
  beforeLoad: async ({ context }) => {
    const results = await context.queryClient.ensureQueryData(
      authorizeBatchQueryOptions([{ permission: "backup:list" }]),
    );
    if (!results[0]) throw redirect({ to: "/" });
  },
  staticData: { crumb: "backup.title" },
});
