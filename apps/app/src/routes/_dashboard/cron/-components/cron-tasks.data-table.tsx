import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@/components/data-table";
import { usePaginatedCronTasks } from "@/hooks/cron-tasks/use-paginated-cron-tasks";

import { CronTaskFormDialog } from "./cron-task-form-dialog";
import { getCronTaskColumns } from "./cron-task.columns";

export function CronTasksDataTable() {
  const { t } = useTranslation("web");

  const [createOpen, setCreateOpen] = useState(false);

  const query = usePaginatedCronTasks();
  const columns = useMemo(() => getCronTaskColumns(t), [t]);

  return (
    <>
      <DataTable
        columns={columns}
        data={query.data ?? []}
        isLoading={query.isLoading}
        searchPlaceholder={t("cron.list.searchPlaceholder")}
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
        // Add item props
        addItemLabel={t("cron.actions.createTask")}
        onAddItem={() => setCreateOpen(true)}
      />
      <CronTaskFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
