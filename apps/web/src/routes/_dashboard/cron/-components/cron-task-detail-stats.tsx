import { ActivityIcon, ClockIcon, TimerIcon, TrendingUpIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCronTaskRunStats } from "@/hooks/cron-tasks/use-cron-task-run-stats";
import i18n from "@/i18n";
import { Card, CardContent } from "~react/components/card";
import { Skeleton } from "~react/components/skeleton";
import { formatValue } from "~shared/i18n";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  isLoading,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  isLoading: boolean;
}) {
  return (
    <Card className="rounded-xl border border-border/60">
      <CardContent className="px-5 py-4 flex items-center gap-3">
        <div className="size-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
          {isLoading ? (
            <Skeleton className="h-6 w-16 mt-0.5" />
          ) : (
            <p className="text-xl font-extrabold tracking-tight leading-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CronTaskDetailStats({ taskId }: { taskId: string }) {
  const { t } = useTranslation("web");
  const { data, isLoading } = useCronTaskRunStats(taskId);

  const stats = data?.success ? data.stats : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Total Runs"
        value={stats?.totalRuns ?? 0}
        icon={ActivityIcon}
        isLoading={isLoading}
      />
      <StatCard
        label={t("pages.cron.stats.successRate")}
        value={stats ? `${stats.successRate}%` : "—"}
        icon={TrendingUpIcon}
        isLoading={isLoading}
      />
      <StatCard
        label="Avg Duration"
        value={stats ? formatDuration(stats.avgDurationMs) : "—"}
        icon={TimerIcon}
        isLoading={isLoading}
      />
      <StatCard
        label={t("pages.cron.columns.lastRun")}
        value={stats?.lastRunAt ? formatValue(new Date(stats.lastRunAt), { locale: i18n.language, format: "relative" }) : "Never"}
        icon={ClockIcon}
        isLoading={isLoading}
      />
    </div>
  );
}
