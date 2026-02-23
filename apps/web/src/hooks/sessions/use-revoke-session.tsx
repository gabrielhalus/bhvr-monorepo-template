import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { revokeSessionMutationOptions } from "@/api/sessions/sessions.mutations";
import { sessionsKeys } from "@/api/sessions/sessions.keys";

export function useRevokeSession() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...revokeSessionMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKeys.mine });
      toast.success(t("pages.account.sessions.revokeSuccess"));
    },
    onError: () => {
      toast.error(t("pages.account.sessions.revokeError"));
    },
  });
}
