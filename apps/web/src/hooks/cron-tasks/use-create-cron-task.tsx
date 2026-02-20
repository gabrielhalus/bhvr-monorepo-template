import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { createCronTaskMutationOptions } from "@/api/cron-tasks/cron-tasks.mutations";

export function useCreateCronTask() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...createCronTaskMutationOptions(queryClient),
    onSuccess: () => {
      toast.success(t("pages.cron.actions.createSuccess"));
    },
    onError: () => {
      toast.error(t("pages.cron.actions.createError"));
    },
  });
}
