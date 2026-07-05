import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { deleteS3BackupMutationOptions } from "@/api/backup/backup.mutations";

export function useDeleteS3Backup() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteS3BackupMutationOptions(queryClient),
    onSuccess: () => {
      toast.success(t("backup.s3.deleteSuccess"));
    },
    meta: { errorMessage: t("backup.s3.deleteError") },
  });
}
