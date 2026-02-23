import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeftIcon, CalendarClockIcon, EditIcon, PlayIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cronTaskQueryOptions, cronTaskRecentRunsQueryOptions, cronTaskRunsChartQueryOptions, cronTaskRunStatsQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";
import { useTriggerCronTask } from "@/hooks/cron-tasks/use-trigger-cron-task";
import { Button } from "~react/components/button";
import { Spinner } from "~react/components/spinner";

import { CronRunsBarChart } from "./-components/cron-runs-bar-chart";
import { CronRunsDataTable } from "./-components/cron-runs.data-table";
import { CronRunsTimeline } from "./-components/cron-runs-timeline";
import { CronTaskDetailStats } from "./-components/cron-task-detail-stats";
import { CronTaskFormDialog } from "./-components/cron-task-form-dialog";

export const Route = createFileRoute("/_dashboard/cron/$taskId")({
  component: CronTaskDetailPage,
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(cronTaskQueryOptions(params.taskId));
    if (!data.success) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData(cronTaskRunStatsQueryOptions(params.taskId)),
      context.queryClient.ensureQueryData(cronTaskRunsChartQueryOptions(params.taskId)),
      context.queryClient.ensureQueryData(cronTaskRecentRunsQueryOptions(params.taskId)),
    ]);
  },
  staticData: { crumb: "pages.cron.title" },
});

function CronTaskDetailPage() {
  const { t } = useTranslation("web");
  const { taskId } = Route.useParams();
  const [editOpen, setEditOpen] = useState(false);

  const { data } = useSuspenseQuery(cronTaskQueryOptions(taskId));
  const triggerMutation = useTriggerCronTask();

  const task = data?.success ? data.task : null;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
      {/* Hero panel */}
      <div className="relative overflow-hidden rounded-2xl p-7 md:p-9" style={{ background: "oklch(0.115 0.008 265)" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(oklch(0.920 0.006 265 / 0.04) 1px, transparent 1px), linear-gradient(90deg, oklch(0.920 0.006 265 / 0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
          style={{ background: "oklch(0.640 0.222 42)", opacity: 0.18 }}
        />

        <div className="relative z-10 space-y-4">
          <Button variant="ghost" size="sm" asChild className="text-panel-meta hover:text-panel-heading px-0">
            <Link to="/cron">
              <ArrowLeftIcon className="size-4" />
              {t("pages.cron.title")}
            </Link>
          </Button>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div
                className="size-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "oklch(0.640 0.222 42 / 0.20)" }}
              >
                <CalendarClockIcon className="size-5" style={{ color: "oklch(0.640 0.222 42)" }} />
              </div>
              <div>
                <h1
                  className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight"
                  style={{ color: "oklch(0.930 0.006 265)" }}
                >
                  {task?.name ?? "Loading…"}
                </h1>
                {task && (
                  <p className="text-sm mt-0.5 font-mono" style={{ color: "oklch(0.550 0.012 265)" }}>
                    {task.cronExpression}
                    <span className="ml-2 font-sans not-italic opacity-70">· {task.handler}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                disabled={!task}
              >
                <EditIcon className="size-4" />
                {t("pages.cron.actions.editTask")}
              </Button>
              <Button
                size="sm"
                onClick={() => taskId && triggerMutation.mutate(taskId)}
                disabled={triggerMutation.isPending || !task}
              >
                {triggerMutation.isPending ? <Spinner /> : <PlayIcon className="size-4" />}
                {t("pages.cron.actions.trigger")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Per-task stats */}
      <CronTaskDetailStats taskId={taskId} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CronRunsBarChart taskId={taskId} />
        <CronRunsTimeline taskId={taskId} />
      </div>

      {/* Runs table */}
      <CronRunsDataTable taskId={taskId} />

      {task && (
        <CronTaskFormDialog open={editOpen} onOpenChange={setEditOpen} task={task} />
      )}
    </div>
  );
}
