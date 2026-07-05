import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { revokeAllMySessionsMutationOptions } from "@/api/sessions/sessions.mutations";

export function useRevokeAllSessions() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    ...revokeAllMySessionsMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["auth"] });
      // `manual` keeps SSO auto-login from signing the user right back in.
      navigate({ to: "/login", search: { manual: true }, replace: true });
    },
    meta: { errorMessage: t("account.sessions.revokeAllError") },
  });
}
