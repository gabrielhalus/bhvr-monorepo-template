import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { revokeAllMySessionsMutationOptions } from "@/api/sessions/sessions.mutations";

export function useRevokeAllSessions() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    ...revokeAllMySessionsMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["auth"] });
      navigate({ to: "/login", replace: true });
    },
    onError: () => {
      toast.error(t("pages.account.sessions.revokeAllError"));
    },
  });
}
