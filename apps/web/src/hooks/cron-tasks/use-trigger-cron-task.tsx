import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cronTasksKeys } from "@/api/cron-tasks/cron-tasks.keys";
import { triggerCronTaskMutationOptions } from "@/api/cron-tasks/cron-tasks.mutations";

export function useTriggerCronTask() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...triggerCronTaskMutationOptions(queryClient),
    onSuccess: (data, taskId) => {
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.byId(taskId) });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.paginated });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.runs(taskId) });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.runStats(taskId) });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.stats });
      if (data.success && data.run.status === "success") {
        toast.success(t("pages.cron.actions.triggerSuccess"));
      } else if (data.success && data.run.status === "error") {
        toast.error(`${t("pages.cron.actions.triggerError")}: ${data.run.error ?? "Unknown error"}`);
      }
    },
    onError: () => {
      toast.error(t("pages.cron.actions.triggerError"));
    },
  });
}
