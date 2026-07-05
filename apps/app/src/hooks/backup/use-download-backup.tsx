import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { downloadClientBackupMutationOptions } from "@/api/backup/backup.mutations";

export function useDownloadBackup() {
  const { t } = useTranslation("web");

  return useMutation({
    ...downloadClientBackupMutationOptions(),
    onSuccess: () => {
      toast.success(t("backup.client.downloadSuccess"));
    },
    meta: { errorMessage: t("backup.client.downloadError") },
  });
}
