import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { deleteLocalBackupMutationOptions } from "@/api/backup/backup.mutations";

export function useDeleteLocalBackup() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteLocalBackupMutationOptions(queryClient),
    onSuccess: () => {
      toast.success(t("backup.local.deleteSuccess"));
    },
    meta: { errorMessage: t("backup.local.deleteError") },
  });
}
