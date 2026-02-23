import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cronTasksKeys } from "@/api/cron-tasks/cron-tasks.keys";
import { updateCronTaskMutationOptions } from "@/api/cron-tasks/cron-tasks.mutations";

export function useUpdateCronTask() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...updateCronTaskMutationOptions(queryClient),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.paginated });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.stats });
      toast.success(t("pages.cron.actions.updateSuccess"));
    },
    onError: () => {
      toast.error(t("pages.cron.actions.updateError"));
    },
  });
}
