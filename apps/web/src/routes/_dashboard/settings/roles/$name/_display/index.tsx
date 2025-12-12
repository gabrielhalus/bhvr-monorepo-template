import { createFileRoute } from "@tanstack/react-router";

import { Form } from "./-components/form";

export const Route = createFileRoute("/_dashboard/settings/roles/$name/_display/")({
  component: RoleDetails,
});

function RoleDetails() {
  return (
    <div className="space-y-4">
      <Form />
    </div>
  );
}
