import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { updateConfigMutationOptions } from "@/api/configs/configs.mutations";

export function useUpdateConfig() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();
  const baseOptions = updateConfigMutationOptions(queryClient);

  return useMutation({
    ...baseOptions,
    onSuccess: (_data, variables) => {
      baseOptions.onSuccess(_data, variables);
      toast.success(t("settings.updateSuccess"));
    },
    meta: { errorMessage: t("settings.updateError") },
  });
}
