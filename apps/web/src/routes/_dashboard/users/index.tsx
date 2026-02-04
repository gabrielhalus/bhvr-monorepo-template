import { createFileRoute } from "@tanstack/react-router";

import { InvitationsDataTable } from "./-components/invitations/invitations.data-table";
import { UsersDataTable } from "./-components/users/users.data-table";

export const Route = createFileRoute("/_dashboard/users/")({
  component: Users,
});

function Users() {
  return (
    <div className="w-full p-10">
      <div className="space-y-8">
        <UsersDataTable />
        <InvitationsDataTable />
      </div>
    </div>
  );
}
