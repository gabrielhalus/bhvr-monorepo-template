import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cronTasksKeys } from "@/api/cron-tasks/cron-tasks.keys";
import { toggleCronTaskMutationOptions } from "@/api/cron-tasks/cron-tasks.mutations";

export function useToggleCronTask() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...toggleCronTaskMutationOptions(queryClient),
    onSuccess: (_data, taskId) => {
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.byId(taskId) });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.paginated });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.stats });
      toast.success(t("pages.cron.actions.toggleSuccess"));
    },
    onError: () => {
      toast.error(t("pages.cron.actions.toggleError"));
    },
  });
}
