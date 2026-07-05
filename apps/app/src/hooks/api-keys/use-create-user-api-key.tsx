import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { apiKeysKeys } from "@/api/api-keys/api-keys.keys";
import { createUserApiKeyMutationOptions } from "@/api/api-keys/api-keys.mutations";

export function useCreateUserApiKey(userId: string) {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...createUserApiKeyMutationOptions(queryClient, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.forUser(userId) });
      toast.success(t("users.detail.createApiKey.success"));
    },
    meta: { errorMessage: t("users.detail.createApiKey.error") },
  });
}
