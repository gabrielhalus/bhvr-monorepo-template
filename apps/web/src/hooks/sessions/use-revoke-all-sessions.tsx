import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { revokeAllMySessionsMutationOptions } from "@/api/sessions/sessions.mutations";

export function useRevokeAllSessions() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...revokeAllMySessionsMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success(t("pages.account.sessions.revokeAllSuccess"));
    },
    onError: () => {
      toast.error(t("pages.account.sessions.revokeAllError"));
    },
  });
}
