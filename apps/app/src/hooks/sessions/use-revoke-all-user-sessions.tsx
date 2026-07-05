import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { sessionsKeys } from "@/api/sessions/sessions.keys";
import { revokeAllUserSessionsMutationOptions } from "@/api/sessions/sessions.mutations";

export function useRevokeAllUserSessions(userId: string) {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...revokeAllUserSessionsMutationOptions(queryClient, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKeys.forUser(userId) });
      toast.success(t("users.detail.sessions.revokeAllSuccess"));
    },
    meta: { errorMessage: t("users.detail.sessions.revokeAllError") },
  });
}
