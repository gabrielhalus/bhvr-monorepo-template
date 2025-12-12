import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/profile")({
  component: Profile,
  loader: () => ({
    crumb: "pages.profile.title",
  }),
});

function Profile() {
  return <div>Hello "/_dashboard/profile"!</div>;
}
