import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { revokeUserSessionMutationOptions } from "@/api/sessions/sessions.mutations";

export function useRevokeUserSession(userId: string) {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...revokeUserSessionMutationOptions(queryClient, userId),
    onSuccess: () => {
      toast.success(t("pages.users.detail.sessions.revokeSuccess"));
    },
    onError: () => {
      toast.error(t("pages.users.detail.sessions.revokeError"));
    },
  });
}
