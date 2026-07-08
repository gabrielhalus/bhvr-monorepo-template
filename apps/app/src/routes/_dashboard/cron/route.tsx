import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authorizeBatchQueryOptions } from "@/queries/auth";
import { featuresQueryOptions } from "@/queries/features";

export const Route = createFileRoute("/_dashboard/cron")({
  component: CronLayout,
  beforeLoad: async ({ context }) => {
    const features = await context.queryClient.ensureQueryData(featuresQueryOptions);
    if (!features["cron-ui"]) throw redirect({ to: "/" });

    const results = await context.queryClient.ensureQueryData(
      authorizeBatchQueryOptions([{ permission: "cronTask:list" }]),
    );

    if (!results[0]) {
      throw redirect({ to: "/" });
    }
  },
  staticData: { crumb: "cron.title" },
});

function CronLayout() {
  return <Outlet />;
}
