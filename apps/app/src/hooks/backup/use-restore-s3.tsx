import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { restoreFromS3MutationOptions } from "@/api/backup/backup.mutations";

export function useRestoreS3() {
  const { t } = useTranslation("web");

  return useMutation({
    ...restoreFromS3MutationOptions(),
    onSuccess: () => {
      toast.success(t("backup.s3.restoreSuccess"));
    },
    meta: { errorMessage: t("backup.s3.restoreError") },
  });
}
