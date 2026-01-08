import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { getRoleByNameQueryOptions } from "@/queries/roles";
import { getUsersQueryOptions } from "@/queries/users";
import { authorizeQueryOptions } from "~react/queries/auth";

import { Nav } from "./-components/nav";
import { Sidebar } from "./-components/sidebar";

export const Route = createFileRoute("/_dashboard/roles/$name")({
  component: RoleLayout,
  beforeLoad: async ({ params, context }) => {
    const { role } = await context.queryClient.ensureQueryData(getRoleByNameQueryOptions(params.name, ["members"]));

    const canRead = await context.queryClient.ensureQueryData(authorizeQueryOptions("role:read", role));

    if (!canRead) {
      throw redirect({ to: "/" });
    }

    return { role };
  },
  loader: async ({ params, context: { queryClient } }) => {
    const { role } = await queryClient.ensureQueryData(getRoleByNameQueryOptions(params.name, ["members"]));
    await queryClient.ensureQueryData(getUsersQueryOptions());

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
        <h1>{t("pages.roles.detail.title", { role: role.label })}</h1>
        <Nav />
        <Outlet />
      </div>
    </div>
  );
}
