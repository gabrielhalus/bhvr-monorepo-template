import type { Invitation } from "~shared/types/db/invitations.types";
import type { User } from "~shared/types/db/users.types";

import { SendIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useInvitationsRelations } from "@/hooks/invitations/use-invitations-relations";
import { usePaginatedInvitations } from "@/hooks/invitations/use-paginated-invitations";
import { DataTable } from "~react/components/data-table";

import { getInvitationColumns } from "./invitation.columns";
import { InviteUserDialog } from "./invite-user-dialog";

export type InvitationRow = Invitation & { invitedBy?: User };

export function InvitationsDataTable() {
  const { t } = useTranslation("web");

  const [dialogOpen, setDialogOpen] = useState(false);

  const columns = useMemo(() => getInvitationColumns(t), [t]);

  const invitationsQuery = usePaginatedInvitations();
  const invitationsIds = useMemo(() => invitationsQuery.data?.map(invitation => invitation.id), [invitationsQuery.data]) ?? [];

  const usersQuery = useInvitationsRelations(invitationsIds, ["invitedBy"]);

  const rows: InvitationRow[] = useMemo(() => {
    if (!invitationsQuery.data) {
      return [];
    }

    return invitationsQuery.data.map(invitation => ({
      ...invitation,
      invitedBy: usersQuery.data?.relations?.[invitation.id]?.invitedBy,
    }));
  }, [invitationsQuery.data, usersQuery.data]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{t("pages.users.invitations.title")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("pages.users.invitations.subtitle")}</p>
      </div>
      <InviteUserDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <DataTable
        columns={columns}
        data={rows}
        isLoading={invitationsQuery.isLoading}
        searchPlaceholder={t("pages.users.invitations.searchPlaceholder")}
        manualPagination
        manualSorting
        manualFiltering
        pagination={invitationsQuery.paginationState}
        onPaginationChange={invitationsQuery.onPaginationChange}
        pageCount={invitationsQuery.pageCount}
        sorting={invitationsQuery.sortingState}
        onSortingChange={invitationsQuery.onSortingChange}
        searchValue={invitationsQuery.searchValue}
        onSearchChange={invitationsQuery.onSearchChange}
        // Add item props
        addItemLabel={t("pages.users.invite.button")}
        addItemIcon={SendIcon}
        onAddItem={() => setDialogOpen(true)}
      />
    </div>
  );
}
