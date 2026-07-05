import type { Invitation } from "~shared/types/db/invitations.types";
import type { User } from "~shared/types/db/users.types";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@/components/data-table";
import { useInvitationsRelations } from "@/hooks/invitations/use-invitations-relations";
import { usePaginatedInvitations } from "@/hooks/invitations/use-paginated-invitations";

import { getInvitationColumns } from "./invitation.columns";
import { InviteUserForm } from "./invite-user-form";

export type InvitationRow = Invitation & { invitedBy?: User };

export function InvitationsDataTable() {
  const { t } = useTranslation("web");

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
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">{t("users.invitations.title")}</h2>
        <p className="mt-0.5 text-[13px] text-muted">{t("users.invitations.subtitle")}</p>
      </div>
      <InviteUserForm />
      <DataTable
        columns={columns}
        data={rows}
        isLoading={invitationsQuery.isLoading}
        searchPlaceholder={t("users.invitations.searchPlaceholder")}
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
      />
    </div>
  );
}
