import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/settings/roles")({
  beforeLoad: async ({ context: { session } }) => {
    if (!session?.can("role:list")) {
      throw redirect({ to: "/" });
    }
  },
  component: RolesLayout,
  loader: () => ({
    crumb: "pages.settings.roles.title",
  }),
});

function RolesLayout() {
  return <Outlet />;
}
