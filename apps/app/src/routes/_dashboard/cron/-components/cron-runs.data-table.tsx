import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@/components/data-table";
import { useCronTaskRuns } from "@/hooks/cron-tasks/use-cron-task-runs";

import { getCronRunColumns } from "./cron-runs.columns";

export function CronRunsDataTable({ taskId }: { taskId: string }) {
  const { t } = useTranslation("web");

  const query = useCronTaskRuns(taskId);
  const columns = useMemo(() => getCronRunColumns(t), [t]);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[15px] font-semibold tracking-tight text-ink">{t("cron.detail.runsTitle")}</h2>
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
