import type { Role as _Role } from "~shared/types/db/roles.types";

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { roleQueryOptions } from "@/api/roles/roles.queries";

import { Nav } from "./-components/nav";
import { Sidebar } from "./-components/sidebar";

export const Route = createFileRoute("/_dashboard/roles/$name")({
  component: RoleLayout,
  loader: ({ params, context }) => context.queryClient.ensureQueryData(roleQueryOptions(params.name)),
  staticData: { crumb: (data: { role?: _Role }) => data.role?.label },
});

function RoleLayout() {
  const { t } = useTranslation("web");
  const { role } = Route.useLoaderData();

  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="w-full max-w-3xl m-4 space-y-8">
        <h1>{t("pages.roles.detail.title", { role: role.label })}</h1>
        <Nav />
        <Outlet />
      </div>
    </div>
  );
}
