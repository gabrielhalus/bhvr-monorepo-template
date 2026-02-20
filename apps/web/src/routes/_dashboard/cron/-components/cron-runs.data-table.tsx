import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useCronTaskRuns } from "@/hooks/cron-tasks/use-cron-task-runs";
import { DataTable } from "~react/components/data-table";

import { getCronRunColumns } from "./cron-runs.columns";

export function CronRunsDataTable({ taskId }: { taskId: string }) {
  const { t } = useTranslation("web");

  const query = useCronTaskRuns(taskId);
  const columns = useMemo(() => getCronRunColumns(t), [t]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{t("pages.cron.detail.runsTitle")}</h2>
      </div>
      <DataTable
        columns={columns}
        data={query.data ?? []}
        isLoading={query.isLoading}
        manualPagination
        manualSorting
        pagination={query.paginationState}
        onPaginationChange={query.onPaginationChange}
        pageCount={query.pageCount}
        sorting={query.sortingState}
        onSortingChange={query.onSortingChange}
      />
    </div>
  );
}
