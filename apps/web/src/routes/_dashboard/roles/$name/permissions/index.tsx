import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_dashboard/roles/$name/permissions/",
)({
  component: RolePermissions,
  loader: () => ({ crumb: "pages.roles.detail.pages.permissions.title" }),
});

function RolePermissions() {
  return (
    <div className="space-y-4">
      <div>
      </div>
    </div>
  );
}
