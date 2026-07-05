import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { changePasswordMutationOptions } from "@/api/users/users.mutations";

export function useChangePassword() {
  const { t } = useTranslation("web");

  return useMutation({
    ...changePasswordMutationOptions(),
    onSuccess: () => {
      toast.success(t("account.changePasswordSuccess"));
    },
    meta: { errorMessage: t("account.changePasswordError") },
  });
}
