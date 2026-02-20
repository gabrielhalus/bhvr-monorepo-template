import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cronTasksKeys } from "@/api/cron-tasks/cron-tasks.keys";
import { deleteCronTaskMutationOptions } from "@/api/cron-tasks/cron-tasks.mutations";

export function useDeleteCronTask() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteCronTaskMutationOptions(queryClient),
    onSuccess: (_data, taskId) => {
      queryClient.removeQueries({ queryKey: cronTasksKeys.byId(taskId) });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.paginated });
      toast.success(t("pages.cron.actions.deleteSuccess"));
    },
    onError: () => {
      toast.error(t("pages.cron.actions.deleteError"));
    },
  });
}
