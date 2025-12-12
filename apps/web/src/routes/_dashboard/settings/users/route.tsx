import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/settings/users")({
  component: UsersLayout,
  beforeLoad: async ({ context: { session } }) => {
    if (!session?.can("user:list")) {
      throw redirect({ to: "/" });
    }
  },
  loader: () => ({
    crumb: "pages.settings.users.title",
  }),
});

function UsersLayout() {
  return <Outlet />;
}
