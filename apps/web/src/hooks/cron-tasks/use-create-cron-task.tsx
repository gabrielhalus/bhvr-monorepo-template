import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cronTasksKeys } from "@/api/cron-tasks/cron-tasks.keys";
import { createCronTaskMutationOptions } from "@/api/cron-tasks/cron-tasks.mutations";

export function useCreateCronTask() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...createCronTaskMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.paginated });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.stats });
      toast.success(t("pages.cron.actions.createSuccess"));
    },
    onError: () => {
      toast.error(t("pages.cron.actions.createError"));
    },
  });
}
