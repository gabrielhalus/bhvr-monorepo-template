import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { sessionsKeys } from "@/api/sessions/sessions.keys";
import { revokeAllMySessionsMutationOptions } from "@/api/sessions/sessions.mutations";

export function useRevokeAllSessions() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...revokeAllMySessionsMutationOptions(queryClient),
    onSuccess: () => {
      // The current session is preserved server-side; just refresh the list.
      queryClient.invalidateQueries({ queryKey: sessionsKeys.mine });
    },
    meta: { errorMessage: t("account.sessions.revokeAllError") },
  });
}
