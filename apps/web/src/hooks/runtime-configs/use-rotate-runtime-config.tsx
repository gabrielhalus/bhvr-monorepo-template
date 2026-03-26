import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { rotateRuntimeConfigMutationOptions } from "@/api/runtime-configs/runtime-configs.mutations";

export function useRotateRuntimeConfig() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();
  const baseOptions = rotateRuntimeConfigMutationOptions(queryClient);

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
