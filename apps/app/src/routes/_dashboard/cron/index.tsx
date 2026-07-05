import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { cronTaskStatsQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";
import { ShellHeader } from "@/components/shell-header";

import { CronTasksDataTable } from "./-components/cron-tasks.data-table";

export const Route = createFileRoute("/_dashboard/cron/")({
  component: CronTasksPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(cronTaskStatsQueryOptions),
});

function CronTasksPage() {
  const { t } = useTranslation("web");
  const { data } = useSuspenseQuery(cronTaskStatsQueryOptions);
  const stats = data?.success ? data.stats : null;

  return (
    <div className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-4 px-4 py-6 md:px-8">
      <ShellHeader
        eyebrow={t("cron.list.subtitle")}
        title={t("cron.title")}
        kpis={[
          { label: t("cron.stats.totalTasks"), value: String(stats?.total ?? 0) },
          { label: t("cron.stats.activeTasks"), value: String(stats?.active ?? 0) },
          { label: t("cron.stats.successRate"), value: stats ? `${stats.successRateSevenDays}%` : "—" },
          { label: t("cron.stats.runsToday"), value: String(stats?.runsToday ?? 0) },
        ]}
      />
      <CronTasksDataTable />
    </div>
  );
}
