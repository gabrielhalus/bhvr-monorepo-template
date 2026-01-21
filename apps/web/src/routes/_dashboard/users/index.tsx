import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getInvitationsQueryOptions } from "@/queries/invitations";
import { getUsersQueryOptions } from "@/queries/users";
import { DataTable } from "~react/components/data-table";

import { getColumns } from "./-components/columns";
import { getInvitationColumns } from "./-components/invitation-columns";
import { InviteUserDialog } from "./-components/invite-user-dialog";

export const Route = createFileRoute("/_dashboard/users/")({
  component: Users,
});

function Users() {
  const { t } = useTranslation("web");

  const columns = useMemo(() => getColumns(t), [t]);
  const invitationColumns = useMemo(() => getInvitationColumns(t), [t]);

  const { isPending: usersLoading, data: usersData } = useQuery(
    getUsersQueryOptions(["roles"]),
  );

  const { isPending: invitationsLoading, data: invitationsData } = useQuery(
    getInvitationsQueryOptions(["invitedBy"]),
  );

  return (
    <div className="w-full p-10">
      <div className="space-y-8">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{t("pages.users.list.title")}</h1>
            <p className="text-muted-foreground">{t("pages.users.list.subtitle")}</p>
          </div>
          <DataTable
            columns={columns}
            data={usersData?.users}
            isLoading={usersLoading}
            searchPlaceholder={t("pages.users.list.searchPlaceholder")}
          />
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{t("pages.users.invitations.title")}</h2>
            <p className="text-muted-foreground">{t("pages.users.invitations.subtitle")}</p>
          </div>
          <DataTable
            columns={invitationColumns}
            data={invitationsData?.invitations}
            isLoading={invitationsLoading}
            searchPlaceholder={t("pages.users.invitations.searchPlaceholder")}
          />
          <div className="flex justify-end">
            <InviteUserDialog />
          </div>
        </div>
      </div>
    </div>
  );
}
