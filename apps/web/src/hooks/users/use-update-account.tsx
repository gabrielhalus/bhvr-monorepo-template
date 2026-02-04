import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { updateAccountMutationOptions } from "@/api/users/users.mutations";
import { authQueryOptions } from "~react/queries/auth";

export function useUpdateAccount() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...updateAccountMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.refetchQueries(authQueryOptions);
      toast.success(t("pages.account.updateSuccess"));
    },
    onError: () => {
      toast.error(t("pages.account.updateError"));
    },
  });
}
