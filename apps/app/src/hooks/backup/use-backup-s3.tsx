import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { triggerS3BackupMutationOptions } from "@/api/backup/backup.mutations";

export function useBackupS3() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...triggerS3BackupMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups", "list"] });
      toast.success(t("backup.s3.triggerSuccess"));
    },
    meta: { errorMessage: t("backup.s3.triggerError") },
  });
}
