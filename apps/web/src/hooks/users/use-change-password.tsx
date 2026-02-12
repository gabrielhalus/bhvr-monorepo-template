import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { changePasswordMutationOptions } from "@/api/users/users.mutations";

export function useChangePassword() {
  const { t } = useTranslation("web");

  return useMutation({
    ...changePasswordMutationOptions(),
    onSuccess: () => {
      toast.success(t("pages.account.changePasswordSuccess"));
    },
    onError: () => {
      toast.error(t("pages.account.changePasswordError"));
    },
  });
}
