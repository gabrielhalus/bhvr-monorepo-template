import { useSuspenseQuery } from "@tanstack/react-query";
import { ActivityIcon, CalendarIcon, CheckCircle2Icon, ListIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cronTaskStatsQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";
import { Card, CardContent } from "~react/components/card";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-xl border border-border/60">
      <CardContent className="px-5 py-4 flex items-center gap-3">
        <div className="size-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
          <p className="text-xl font-extrabold tracking-tight leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CronStatsCards() {
  const { t } = useTranslation("web");
  const { data } = useSuspenseQuery(cronTaskStatsQueryOptions);

  const stats = data?.success ? data.stats : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label={t("pages.cron.stats.totalTasks")}
        value={stats?.total ?? 0}
        icon={ListIcon}
      />
      <StatCard
        label={t("pages.cron.stats.activeTasks")}
        value={stats?.active ?? 0}
        icon={ActivityIcon}
      />
      <StatCard
        label={t("pages.cron.stats.successRate")}
        value={stats ? `${stats.successRateSevenDays}%` : "—"}
        icon={CheckCircle2Icon}
      />
      <StatCard
        label={t("pages.cron.stats.runsToday")}
        value={stats?.runsToday ?? 0}
        icon={CalendarIcon}
      />
    </div>
  );
}
