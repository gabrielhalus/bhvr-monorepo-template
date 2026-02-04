import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Sidebar } from "./-components/sidebar";

export const Route = createFileRoute("/_dashboard/settings")({
  component: RouteComponent,
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
