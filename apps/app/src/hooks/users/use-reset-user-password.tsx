import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { resetUserPasswordMutationOptions } from "@/api/users/users.mutations";

export function useResetUserPassword() {
  const { t } = useTranslation("web");
  const options = resetUserPasswordMutationOptions();

  return useMutation({
    ...options,
    meta: { errorMessage: t("users.detail.resetPassword.error") },
  });
}
