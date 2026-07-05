import type { CronTaskRun } from "~shared/queries/cron-task-runs.queries";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { cronTaskRecentRunsQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";
import i18n from "@/i18n";
import { Panel } from "~orbit/components/ui/Panel";
import { Tooltip, TooltipContent, TooltipTrigger } from "~orbit/components/ui/Tooltip";
import { cn } from "~orbit/lib/utils";
import { formatValue } from "~shared/i18n";

const STATUS_DOT: Record<string, string> = {
  success: "bg-sage",
  error: "bg-coral",
  running: "bg-sky",
};

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function RunDot({ run }: { run: CronTaskRun }) {
  const label = [
    formatValue(new Date(run.startedAt), { locale: i18n.language, format: "datetime" }),
    run.durationMs !== null ? formatDuration(run.durationMs) : null,
    run.status === "error" && run.error ? run.error.slice(0, 80) : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn("size-3 shrink-0 rounded-full transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40", STATUS_DOT[run.status] ?? STATUS_DOT.running)}
          aria-label={`${run.status} at ${run.startedAt}`}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="whitespace-pre-line text-center">
        <span className="font-semibold capitalize">{run.status}</span>
        {"\n"}
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function CronRunsTimeline({ taskId }: { taskId: string }) {
  const { t } = useTranslation("web");
  const { data } = useSuspenseQuery(cronTaskRecentRunsQueryOptions(taskId));

  const runs = data?.success ? data.runs : [];

  return (
    <Panel>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{t("cron.detail.timelineTitle")}</h2>
      </div>
      <div className="p-5">
        {runs.length === 0
          ? <p className="text-sm text-muted">{t("status.noData")}</p>
          : (
              <div className="flex flex-wrap items-center gap-2">
                {runs.map(run => <RunDot key={run.id} run={run} />)}
              </div>
            )}

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4">
          {(["success", "error", "running"] as const).map(status => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={cn("size-2.5 rounded-full", STATUS_DOT[status])} />
              <span className="text-xs text-muted">{t(`cron.runs.status.${status}` as never)}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
