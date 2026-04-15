import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { rotateConfigMutationOptions } from "@/api/configs/configs.mutations";

export function useRotateConfig() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();
  const baseOptions = rotateConfigMutationOptions(queryClient);

  return useMutation({
    ...baseOptions,
    onSuccess: (_data, key) => {
      baseOptions.onSuccess(_data, key);
      toast.success(t("pages.settings.rotateSuccess"));
    },
    onError: () => {
      toast.error(t("pages.settings.rotateError"));
    },
  });
}
