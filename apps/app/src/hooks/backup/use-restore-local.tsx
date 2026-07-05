import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { restoreFromLocalMutationOptions } from "@/api/backup/backup.mutations";

export function useRestoreLocal() {
  const { t } = useTranslation("web");

  return useMutation({
    ...restoreFromLocalMutationOptions(),
    onSuccess: () => {
      toast.success(t("backup.local.restoreSuccess"));
    },
    meta: { errorMessage: t("backup.local.restoreError") },
  });
}
