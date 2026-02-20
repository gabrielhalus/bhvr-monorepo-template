import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";

import { useCronTaskRunsChart } from "@/hooks/cron-tasks/use-cron-task-runs-chart";
import { Card, CardContent, CardHeader, CardTitle } from "~react/components/card";
import { Skeleton } from "~react/components/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~react/components/chart";

const chartConfig = {
  success: {
    label: "Success",
    color: "var(--chart-1)",
  },
  error: {
    label: "Error",
    color: "var(--destructive)",
  },
};

export function CronRunsBarChart({ taskId }: { taskId: string }) {
  const { t } = useTranslation("web");
  const { data, isLoading } = useCronTaskRunsChart(taskId);

  const chartData = data?.success ? data.data : [];

  const formattedData = chartData.map(d => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    success: Number(d.success),
    error: Number(d.error),
  }));

  return (
    <Card className="rounded-xl border border-border/60">
      <CardHeader className="px-5 py-4 border-b-0">
        <CardTitle className="text-base">{t("pages.cron.detail.chartTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        {isLoading ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : formattedData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            No execution data yet
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-48 w-full">
            <BarChart data={formattedData} barGap={2}>
              <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.07} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={28} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="success" stackId="a" fill="var(--color-success)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="error" stackId="a" fill="var(--color-error)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
