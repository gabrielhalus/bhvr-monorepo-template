import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { usePaginatedRoles } from "@/hooks/roles/use-paginated-roles";
import { DataTable } from "~react/components/data-table";

import { getRoleColumns } from "./-components/role.columns";

export const Route = createFileRoute("/_dashboard/roles/")({
  component: Roles,
});

function Roles() {
  const { t } = useTranslation("web");

  const columns = useMemo(() => getRoleColumns(t), [t]);

  const rolesQuery = usePaginatedRoles();

  return (
    <div className="w-full p-10">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{t("pages.roles.list.title")}</h1>
          <p className="text-muted-foreground">{t("pages.roles.list.subtitle")}</p>
        </div>
        <DataTable
          columns={columns}
          data={rolesQuery.data}
          isLoading={rolesQuery.isLoading}
          searchPlaceholder={t("pages.roles.list.searchPlaceholder")}
          manualPagination
          manualSorting
          manualFiltering
          pagination={rolesQuery.paginationState}
          onPaginationChange={rolesQuery.onPaginationChange}
          pageCount={rolesQuery.pageCount}
          sorting={rolesQuery.sortingState}
          onSortingChange={rolesQuery.onSortingChange}
          searchValue={rolesQuery.searchValue}
          onSearchChange={rolesQuery.onSearchChange}
        />
      </div>
    </div>
  );
}
