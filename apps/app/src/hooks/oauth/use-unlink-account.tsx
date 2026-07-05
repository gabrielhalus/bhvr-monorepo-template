import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { unlinkAccountMutationOptions } from "@/api/oauth/oauth.mutations";

export function useUnlinkAccount() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...unlinkAccountMutationOptions(queryClient),
    onSuccess: () => {
      toast.success(t("account.linkedAccounts.unlinkSuccess"));
    },
    meta: { errorMessage: t("account.linkedAccounts.unlinkError") },
  });
}
