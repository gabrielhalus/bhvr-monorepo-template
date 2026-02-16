import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { revokeAllUserSessionsMutationOptions } from "@/api/sessions/sessions.mutations";

export function useRevokeAllUserSessions(userId: string) {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...revokeAllUserSessionsMutationOptions(queryClient, userId),
    onSuccess: () => {
      toast.success(t("pages.users.detail.sessions.revokeAllSuccess"));
    },
    onError: () => {
      toast.error(t("pages.users.detail.sessions.revokeAllError"));
    },
  });
}
