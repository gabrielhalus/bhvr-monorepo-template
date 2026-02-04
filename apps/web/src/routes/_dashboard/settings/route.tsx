import { createFileRoute, Outlet } from "@tanstack/react-router";

import { runtimeConfigsQueryOptions } from "@/api/runtime-configs/runtime-configs.queries";

import { Sidebar } from "./-components/sidebar";

export const Route = createFileRoute("/_dashboard/settings")({
  component: RouteComponent,
  loader: ({ context }) => context.queryClient.ensureQueryData(runtimeConfigsQueryOptions),
  staticData: { crumb: "pages.settings.title" },
});

function RouteComponent() {
  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="w-full max-w-3xl m-4 space-y-8">
        <Outlet />
      </div>
    </div>
  );
}
