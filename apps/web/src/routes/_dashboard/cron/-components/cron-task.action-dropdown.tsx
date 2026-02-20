import type { Row } from "@tanstack/react-table";
import type { CronTask } from "~shared/queries/cron-tasks.queries";

import { EditIcon, MoreHorizontalIcon, PlayIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useDeleteCronTask } from "@/hooks/cron-tasks/use-delete-cron-task";
import { useTriggerCronTask } from "@/hooks/cron-tasks/use-trigger-cron-task";
import { Button } from "~react/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~react/components/dropdown-menu";
import { Spinner } from "~react/components/spinner";
import sayno from "~react/lib/sayno";

import { CronTaskFormDialog } from "./cron-task-form-dialog";

export function CronTaskActionDropdown({ row: { original: task } }: { row: Row<CronTask> }) {
  const { t } = useTranslation("web");
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useDeleteCronTask();
  const triggerMutation = useTriggerCronTask();

  const handleDelete = async () => {
    const confirmed = await sayno.confirm({
      title: t("pages.cron.actions.deleteTask"),
      description: t("pages.cron.actions.deleteConfirm"),
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
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{t("pages.cron.actions.openMenu")}</span>
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => triggerMutation.mutate(task.id)}
            disabled={triggerMutation.isPending}
          >
            {triggerMutation.isPending ? <Spinner /> : <PlayIcon className="size-4" />}
            {t("pages.cron.actions.trigger")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <EditIcon className="size-4" />
            {t("pages.cron.actions.editTask")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            {deleteMutation.isPending ? <Spinner /> : <Trash2Icon className="size-4" />}
            {t("pages.cron.actions.deleteTask")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CronTaskFormDialog open={editOpen} onOpenChange={setEditOpen} task={task} />
    </>
  );
}
