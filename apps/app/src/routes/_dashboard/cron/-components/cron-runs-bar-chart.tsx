import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { cronTaskRunsChartQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";
import { Panel } from "~orbit/components/ui/Panel";

export function CronRunsBarChart({ taskId }: { taskId: string }) {
  const { t } = useTranslation("web");
  const { data } = useSuspenseQuery(cronTaskRunsChartQueryOptions(taskId));

  const chartData = data?.success ? data.data : [];

  const formattedData = chartData.map(d => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    success: Number(d.success),
    error: Number(d.error),
  }));

  return (
    <Panel>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{t("cron.detail.chartTitle")}</h2>
      </div>
      <div className="p-5">
        {formattedData.length === 0
          ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted">
                {t("status.noData")}
              </div>
            )
          : (
              <ResponsiveContainer width="100%" height={192}>
                <BarChart data={formattedData} barGap={2}>
                  <CartesianGrid vertical={false} stroke="var(--color-line)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted)" }} width={28} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "var(--color-surface-2)" }}
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid var(--color-line)",
                      background: "var(--color-surface)",
                      fontSize: "12px",
                      color: "var(--color-ink)",
                    }}
                  />
                  <Bar dataKey="success" stackId="a" fill="var(--color-sage)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="error" stackId="a" fill="var(--color-coral)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
      </div>
    </Panel>
  );
}
