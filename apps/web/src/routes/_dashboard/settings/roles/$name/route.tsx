import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Nav } from "./-components/nav";
import { Sidebar } from "./-components/sidebar";
import { getRoleByNameQueryOptions } from "@/queries/roles";
import { getAllUsersQueryOptions } from "@/queries/users";

export const Route = createFileRoute("/_dashboard/settings/roles/$name")({
  component: RoleLayout,
  beforeLoad: async ({ params, context: { queryClient, session } }) => {
    const { role } = await queryClient.ensureQueryData(getRoleByNameQueryOptions(params.name));

    if (!session?.can("role:read", role)) {
      throw redirect({ to: "/" });
    }

    return { role };
  },
  loader: async ({ params, context: { queryClient } }) => {
    const { role } = await queryClient.ensureQueryData(getRoleByNameQueryOptions(params.name));
    await queryClient.ensureQueryData(getAllUsersQueryOptions);

    return { role, crumb: role.label };
  },
});

function RoleLayout() {
  const { t } = useTranslation("web");
  const { role } = Route.useLoaderData();

  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="w-full max-w-3xl m-4 space-y-8">
        <h1>{t("pages.settings.roles.detail.title", { role: role.label })}</h1>
        <Nav />
        <Outlet />
      </div>
    </div>
  );
}
