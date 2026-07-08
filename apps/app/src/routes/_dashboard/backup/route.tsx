import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authorizeBatchQueryOptions } from "@/queries/auth";
import { featuresQueryOptions } from "@/queries/features";

export const Route = createFileRoute("/_dashboard/backup")({
  component: () => <Outlet />,
  beforeLoad: async ({ context }) => {
    const features = await context.queryClient.ensureQueryData(featuresQueryOptions);
    if (!features.backups) throw redirect({ to: "/" });

    const results = await context.queryClient.ensureQueryData(
      authorizeBatchQueryOptions([{ permission: "backup:list" }]),
    );
    if (!results[0]) throw redirect({ to: "/" });
  },
  staticData: { crumb: "backup.title" },
});
