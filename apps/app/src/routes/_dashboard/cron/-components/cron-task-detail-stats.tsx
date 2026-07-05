import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { cronTaskRunStatsQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";
import { StatStrip } from "@/components/list-kit";
import i18n from "@/i18n";
import { formatValue } from "~shared/i18n";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function CronTaskDetailStats({ taskId }: { taskId: string }) {
  const { t } = useTranslation("web");
  const { data } = useSuspenseQuery(cronTaskRunStatsQueryOptions(taskId));

  const stats = data?.success ? data.stats : null;

  return (
    <StatStrip
      cells={[
        { label: t("cron.detail.totalRuns"), value: stats?.totalRuns ?? 0 },
        { label: t("cron.stats.successRate"), value: stats ? `${stats.successRate}%` : "—" },
        { label: t("cron.detail.avgDuration"), value: stats ? formatDuration(stats.avgDurationMs) : "—" },
        { label: t("cron.columns.lastRun"), value: stats?.lastRunAt ? formatValue(new Date(stats.lastRunAt), { locale: i18n.language, format: "relative" }) : t("cron.detail.never") },
      ]}
    />
  );
}
