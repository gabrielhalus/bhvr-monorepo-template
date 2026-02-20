import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authorizeBatchQueryOptions } from "~react/queries/auth";

export const Route = createFileRoute("/_dashboard/cron")({
  component: CronLayout,
  beforeLoad: async ({ context }) => {
    const results = await context.queryClient.ensureQueryData(
      authorizeBatchQueryOptions([{ permission: "cronTask:list" }]),
    );

    if (!results[0]) {
      throw redirect({ to: "/" });
    }
  },
  staticData: { crumb: "pages.cron.title" },
});

function CronLayout() {
  return <Outlet />;
}
