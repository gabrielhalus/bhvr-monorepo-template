import type { SortingState } from "@tanstack/react-table";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { getColumns } from "./-components/columns";
import CreateForm from "./-components/create-form";
import { getNotificationProvidersPaginatedQueryOption } from "@/queries/notification-providers";
import { Button } from "@bunstack/react/components/button";
import { DataTable } from "@bunstack/react/components/data-table";
import { debounceSync } from "@bunstack/shared/lib/debounce";

export const Route = createFileRoute("/_dashboard/settings/notifications/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation("web");

  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const debouncedSearch = useMemo(
    () => debounceSync((searchValue: string) => {
      setDebouncedFilter(searchValue);
      // Reset to first page when searching
      setPagination(prev => ({ ...prev, page: 0 }));
    }, 300),
    [],
  );

  const handleSearchChange = useCallback((value: string) => {
    setGlobalFilter(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const sortField = sorting.length ? sorting[0]?.id : undefined;
  const sortDirection = sorting.length ? (sorting[0]?.desc ? "desc" : "asc") : undefined;

  const { isPending, data } = useQuery(getNotificationProvidersPaginatedQueryOption({
    page: String(pagination.pageIndex),
    pageSize: String(pagination.pageSize),
    sortField,
    sortDirection,
    search: debouncedFilter || undefined,
  }));

  useEffect(() => {
    if (isPending) {
      searchInputRef.current?.focus();
    }
  }, [isPending]);

  const pageCount = data?.total ? Math.ceil(data.total / pagination.pageSize) : 0;
  const columns = useMemo(() => getColumns(t), [t]);

  return (
    <div className="w-full py-10 px-10">
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold">{t("pages.settings.notifications.list.title")}</h1>
            <p className="text-muted-foreground">{t("pages.settings.notifications.list.subtitle")}</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>{t("pages.settings.notifications.list.createButton")}</Button>
        </div>
        <DataTable
          columns={columns}
          data={data?.providers}
          isLoading={isPending}
          searchPlaceholder={t("pages.settings.notifications.list.searchPlaceholder")}
          searchValue={globalFilter}
          onSearchChange={handleSearchChange}
          searchInputRef={searchInputRef}
          pagination={pagination}
          onPaginationChange={setPagination}
          pageCount={pageCount}
          manualPagination={true}
          sorting={sorting}
          onSortingChange={setSorting}
          manualSorting={true}
          manualFiltering={true}
        />
        <CreateForm open={isFormOpen} setOpen={setIsFormOpen} />
      </div>
    </div>
  );
}
