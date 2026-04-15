import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { logsKeys } from "@/api/logs/logs.keys";
import { clearLogsMutationOptions } from "@/api/logs/logs.mutations";

export function useClearLogs() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...clearLogsMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logsKeys.all });
      toast.success(t("pages.logs.actions.clearLogsSuccess"));
    },
    onError: () => {
      toast.error(t("pages.logs.actions.clearLogsError"));
    },
  });
}
