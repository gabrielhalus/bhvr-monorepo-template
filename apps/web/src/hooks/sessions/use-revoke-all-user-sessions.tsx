import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { revokeAllUserSessionsMutationOptions } from "@/api/sessions/sessions.mutations";
import { sessionsKeys } from "@/api/sessions/sessions.keys";

export function useRevokeAllUserSessions(userId: string) {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...revokeAllUserSessionsMutationOptions(queryClient, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKeys.forUser(userId) });
      toast.success(t("pages.users.detail.sessions.revokeAllSuccess"));
    },
    onError: () => {
      toast.error(t("pages.users.detail.sessions.revokeAllError"));
    },
  });
}
