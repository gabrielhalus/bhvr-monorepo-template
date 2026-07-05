import type { Row } from "@tanstack/react-table";
import type { CronTask } from "~shared/queries/cron-tasks.queries";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useDeleteCronTask } from "@/hooks/cron-tasks/use-delete-cron-task";
import { useTriggerCronTask } from "@/hooks/cron-tasks/use-trigger-cron-task";
import sayno from "@/lib/sayno";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~orbit/components/ui/DropdownMenu";
import { Edit, Loader2, MoreHorizontal, Play, Trash2 } from "~orbit/components/ui/icons";

import { CronTaskFormDialog } from "./cron-task-form-dialog";

export function CronTaskActionDropdown({ row: { original: task } }: { row: Row<CronTask> }) {
  const { t } = useTranslation("web");
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useDeleteCronTask();
  const triggerMutation = useTriggerCronTask();

  const handleDelete = async () => {
    const confirmed = await sayno.confirm({
      title: t("cron.actions.deleteTask"),
      description: t("cron.actions.deleteConfirm"),
      variant: "destructive",
    });

    if (confirmed) {
      deleteMutation.mutate(task.id);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink">
            <span className="sr-only">{t("cron.actions.openMenu")}</span>
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => triggerMutation.mutate(task.id)}
            disabled={triggerMutation.isPending}
          >
            {triggerMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {t("cron.actions.trigger")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="size-4" />
            {t("cron.actions.editTask")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="danger"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {t("cron.actions.deleteTask")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CronTaskFormDialog open={editOpen} onOpenChange={setEditOpen} task={task} />
    </>
  );
}
