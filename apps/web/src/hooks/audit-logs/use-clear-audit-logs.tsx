import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { auditLogsKeys } from "@/api/audit-logs/audit-logs.keys";
import { clearAuditLogsMutationOptions } from "@/api/audit-logs/audit-logs.mutations";

export function useClearAuditLogs() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...clearAuditLogsMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success(t("pages.logs.actions.clearLogsSuccess"));
    },
    onError: () => {
      toast.error(t("pages.logs.actions.clearLogsError"));
    },
  });
}
