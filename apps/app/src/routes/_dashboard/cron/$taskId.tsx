import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cronTaskQueryOptions, cronTaskRecentRunsQueryOptions, cronTaskRunsChartQueryOptions, cronTaskRunStatsQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";
import { useTriggerCronTask } from "@/hooks/cron-tasks/use-trigger-cron-task";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "~orbit/components/ui/Breadcrumb";
import { Button } from "~orbit/components/ui/Button";
import { CalendarClock, Edit, Loader2, Play } from "~orbit/components/ui/icons";
import { Panel } from "~orbit/components/ui/Panel";

import { CronRunsBarChart } from "./-components/cron-runs-bar-chart";
import { CronRunsTimeline } from "./-components/cron-runs-timeline";
import { CronRunsDataTable } from "./-components/cron-runs.data-table";
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
  staticData: { crumb: "cron.title" },
});

function CronTaskDetailPage() {
  const { t } = useTranslation("web");
  const { taskId } = Route.useParams();
  const [editOpen, setEditOpen] = useState(false);

  const { data } = useSuspenseQuery(cronTaskQueryOptions(taskId));
  const triggerMutation = useTriggerCronTask();

  const task = data?.success ? data.task : null;

  return (
    <div className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-4 px-4 py-6 md:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/cron">{t("cron.title")}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{task?.name ?? "…"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero panel */}
      <Panel tone="ink" className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-white shadow-soft">
              <CalendarClock className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold tracking-tight text-paper md:text-3xl">{task?.name ?? "Loading…"}</h1>
              {task && (
                <p className="mt-0.5 font-mono text-sm text-paper/55">
                  {task.cronExpression}
                  <span className="ml-2 font-sans text-paper/40">
                    {" · "}
                    {task.handler}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              disabled={!task}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[13px] font-medium text-white/85 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              <Edit className="size-3.5" />
              {t("cron.actions.editTask")}
            </button>
            <Button size="sm" onClick={() => taskId && triggerMutation.mutate(taskId)} disabled={triggerMutation.isPending || !task}>
              {triggerMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
              {t("cron.actions.trigger")}
            </Button>
          </div>
        </div>
      </Panel>

      {/* Per-task stats */}
      <CronTaskDetailStats taskId={taskId} />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
