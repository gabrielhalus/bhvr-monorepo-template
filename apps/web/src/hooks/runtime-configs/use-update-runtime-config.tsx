import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { runtimeConfigsKeys } from "@/api/runtime-configs/runtime-configs.keys";
import { updateRuntimeConfigMutationOptions } from "@/api/runtime-configs/runtime-configs.mutations";

export function useUpdateRuntimeConfig() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...updateRuntimeConfigMutationOptions(queryClient),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: runtimeConfigsKeys.byKey(variables.key) });
      queryClient.invalidateQueries({ queryKey: runtimeConfigsKeys.list });
      toast.success(t("pages.settings.updateSuccess"));
    },
    onError: () => {
      toast.error(t("pages.settings.updateError"));
    },
  });
}
