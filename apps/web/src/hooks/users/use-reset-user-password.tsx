import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { resetUserPasswordMutationOptions } from "@/api/users/users.mutations";

export function useResetUserPassword() {
  const { t } = useTranslation("web");
  const options = resetUserPasswordMutationOptions();

  return useMutation({
    ...options,
    onError: () => {
      toast.error(t("pages.users.detail.resetPassword.error"));
    },
  });
}
