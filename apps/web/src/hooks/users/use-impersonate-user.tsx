import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { impersonateUserMutationOptions } from "@/api/users/users.mutations";

export function useImpersonateUser(userName?: string) {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    ...impersonateUserMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success(t("pages.users.detail.impersonate.success", { name: userName }));
      navigate({ to: "/" });
    },
    onError: (error) => {
      toast.error(error.message || t("pages.users.detail.impersonate.error"));
    },
  });
}
