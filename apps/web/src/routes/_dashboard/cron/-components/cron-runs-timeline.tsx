import type { CronTaskRun } from "~shared/queries/cron-task-runs.queries";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { cronTaskRecentRunsQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";
import i18n from "@/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "~react/components/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "~react/components/tooltip";
import { formatValue } from "~shared/i18n";

function formatDuration(ms: number | null): string {
  if (ms === null)
    return "—";
  if (ms < 1000)
    return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function RunDot({ run }: { run: CronTaskRun }) {
  const statusColors: Record<string, string> = {
    success: "oklch(0.640 0.222 42)",
    error: "oklch(0.580 0.210 24)",
    running: "oklch(0.600 0.120 265)",
  };

  const color = statusColors[run.status] ?? statusColors.running;

  const label = [
    formatValue(new Date(run.startedAt), { locale: i18n.language, format: "datetime" }),
    run.durationMs !== null ? `Duration: ${formatDuration(run.durationMs)}` : null,
    run.status === "error" && run.error ? `Error: ${run.error.slice(0, 80)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="size-3 rounded-full shrink-0 transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ background: color }}
          aria-label={`${run.status} at ${run.startedAt}`}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="whitespace-pre-line text-center">
        <span className="font-semibold capitalize">{run.status}</span>
        {"\n"}
        {label.split("\n").slice(1).join("\n")}
      </TooltipContent>
    </Tooltip>
  );
}

export function CronRunsTimeline({ taskId }: { taskId: string }) {
  const { t } = useTranslation("web");
  const { data } = useSuspenseQuery(cronTaskRecentRunsQueryOptions(taskId));

  const runs = data?.success ? data.runs : [];

  return (
    <Card className="rounded-xl border border-border/60">
      <CardHeader className="px-5 py-4 border-b-0">
        <CardTitle className="text-base">{t("pages.cron.detail.timelineTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        {runs.length === 0
          ? (
              <p className="text-sm text-muted-foreground">No runs yet</p>
            )
          : (
              <div className="flex items-center gap-2 flex-wrap">
                {runs.map(run => (
                  <RunDot key={run.id} run={run} />
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  ← older · newer →
                </span>
              </div>
            )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3">
          {[
            { color: "oklch(0.640 0.222 42)", label: "Success" },
            { color: "oklch(0.580 0.210 24)", label: "Error" },
            { color: "oklch(0.600 0.120 265)", label: "Running" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full" style={{ background: color }} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
