import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { getInvitationsQueryOptions } from "@/queries/invitations";
import { DataTable } from "~react/components/data-table";

import { invitationColumns } from "./-components/columns";
import { InviteUserDialog } from "./-components/invite-user-dialog";

export const Route = createFileRoute("/_dashboard/invitations/")({
  component: Invitations,
});

function Invitations() {
  const { isPending, data } = useQuery(
    getInvitationsQueryOptions(["invitedBy"]),
  );

  return (
    <div className="w-full py-10 px-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invitations</h1>
            <p className="text-muted-foreground">Invite new users and manage pending invitations</p>
          </div>
          <InviteUserDialog />
        </div>
        <DataTable
          columns={invitationColumns}
          data={data?.invitations}
          isLoading={isPending}
          searchPlaceholder="Search invitations..."
        />
      </div>
    </div>
  );
}
