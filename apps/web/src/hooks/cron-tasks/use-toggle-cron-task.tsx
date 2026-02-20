import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { toggleCronTaskMutationOptions } from "@/api/cron-tasks/cron-tasks.mutations";

export function useToggleCronTask() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...toggleCronTaskMutationOptions(queryClient),
    onSuccess: () => {
      toast.success(t("pages.cron.actions.toggleSuccess"));
    },
    onError: () => {
      toast.error(t("pages.cron.actions.toggleError"));
    },
  });
}
