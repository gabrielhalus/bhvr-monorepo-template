import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { usePaginatedCronTasks } from "@/hooks/cron-tasks/use-paginated-cron-tasks";
import { DataTable } from "~react/components/data-table";

import { getCronTaskColumns } from "./cron-task.columns";

export function CronTasksDataTable() {
  const { t } = useTranslation("web");

  const query = usePaginatedCronTasks();
  const columns = useMemo(() => getCronTaskColumns(t), [t]);

  return (
    <DataTable
      columns={columns}
      data={query.data ?? []}
      isLoading={query.isLoading}
      searchPlaceholder={t("pages.cron.list.searchPlaceholder")}
      manualPagination
      manualSorting
      manualFiltering
      pagination={query.paginationState}
      onPaginationChange={query.onPaginationChange}
      pageCount={query.pageCount}
      sorting={query.sortingState}
      onSortingChange={query.onSortingChange}
      searchValue={query.searchValue}
      onSearchChange={query.onSearchChange}
    />
  );
}
