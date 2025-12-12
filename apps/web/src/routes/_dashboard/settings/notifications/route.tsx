import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/settings/notifications")({
  component: NotificationsLayout,
  beforeLoad: async ({ context: { session } }) => {
    if (!session?.can("notification:list")) {
      throw redirect({ to: "/" });
    }
  },
  loader: () => ({
    crumb: "pages.settings.notifications.title",
  }),
});

function NotificationsLayout() {
  return <Outlet />;
}
