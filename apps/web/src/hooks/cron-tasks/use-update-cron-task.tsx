import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { updateCronTaskMutationOptions } from "@/api/cron-tasks/cron-tasks.mutations";

export function useUpdateCronTask() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...updateCronTaskMutationOptions(queryClient),
    onSuccess: () => {
      toast.success(t("pages.cron.actions.updateSuccess"));
    },
    onError: () => {
      toast.error(t("pages.cron.actions.updateError"));
    },
  });
}
