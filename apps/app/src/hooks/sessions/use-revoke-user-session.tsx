import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { sessionsKeys } from "@/api/sessions/sessions.keys";
import { revokeUserSessionMutationOptions } from "@/api/sessions/sessions.mutations";

export function useRevokeUserSession(userId: string) {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...revokeUserSessionMutationOptions(queryClient, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKeys.forUser(userId) });
      toast.success(t("users.detail.sessions.revokeSuccess"));
    },
    meta: { errorMessage: t("users.detail.sessions.revokeError") },
  });
}
