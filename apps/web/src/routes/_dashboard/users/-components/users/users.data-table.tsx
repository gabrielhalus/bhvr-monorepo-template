import type { UserWithRelations } from "~shared/types/db/users.types";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { usePaginatedUsers } from "@/hooks/users/use-paginated-users";
import { useUsersRelations } from "@/hooks/users/use-users-relations";
import { DataTable } from "~react/components/data-table";
import { authorizeBatchQueryOptions } from "~react/queries/auth";

import { getUserColumns } from "./user.columns";

export function UsersDataTable() {
  const { t } = useTranslation("web");

  const usersQuery = usePaginatedUsers();
  const userIds = useMemo(() => usersQuery.data?.map(user => user.id), [usersQuery.data]) ?? [];

  const rolesQuery = useUsersRelations(userIds, ["roles"]);

  const authChecks = useMemo(
    () => (usersQuery.data ?? []).map(user => ({ permission: "user:delete" as const, resource: user })),
    [usersQuery.data],
  );
  const authQuery = useQuery(authorizeBatchQueryOptions(authChecks));

  const canDeleteMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    usersQuery.data?.forEach((user, i) => {
      map[user.id] = authQuery.data?.[i] ?? false;
    });
    return map;
  }, [usersQuery.data, authQuery.data]);

  const columns = useMemo(() => getUserColumns(t, canDeleteMap), [t, canDeleteMap]);

  const rows: UserWithRelations<["roles"]>[] = useMemo(() => {
    if (!usersQuery.data) {
      return [];
    }

    return usersQuery.data.map(user => ({
      ...user,
      roles: rolesQuery.data?.relations?.[user.id]?.roles ?? [],
    }));
  }, [usersQuery.data, rolesQuery.data]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{t("pages.users.list.title")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("pages.users.list.subtitle")}</p>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={usersQuery.isLoading}
        searchPlaceholder={t("pages.users.list.searchPlaceholder")}
        manualPagination
        manualSorting
        manualFiltering
        pagination={usersQuery.paginationState}
        onPaginationChange={usersQuery.onPaginationChange}
        pageCount={usersQuery.pageCount}
        sorting={usersQuery.sortingState}
        onSortingChange={usersQuery.onSortingChange}
        searchValue={usersQuery.searchValue}
        onSearchChange={usersQuery.onSearchChange}
      />
    </div>
  );
}
