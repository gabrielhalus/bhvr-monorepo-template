import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { triggerLocalBackupMutationOptions } from "@/api/backup/backup.mutations";

export function useBackupLocal() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  const baseOptions = triggerLocalBackupMutationOptions(queryClient);

  return useMutation({
    ...baseOptions,
    onSuccess: () => {
      toast.success(t("backup.local.triggerSuccess"));
    },
    onError: (err, vars, ctx) => {
      baseOptions.onError(err, vars, ctx);
      toast.error(t("backup.local.triggerError"));
    },
  });
}
