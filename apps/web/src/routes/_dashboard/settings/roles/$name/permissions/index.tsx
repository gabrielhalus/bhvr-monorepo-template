import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_dashboard/settings/roles/$name/permissions/",
)({
  component: RolePermissions,
  loader: () => ({ crumb: "pages.settings.roles.detail.pages.permissions.title" }),
});

function RolePermissions() {
  return (
    <div className="space-y-4">
      <div>
      </div>
    </div>
  );
}
