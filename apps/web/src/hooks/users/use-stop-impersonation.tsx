import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { stopImpersonationMutationOptions } from "@/api/users/users.mutations";

export function useStopImpersonation() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    ...stopImpersonationMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.refetchQueries();
      toast.success(t("impersonation.stopped"));
      navigate({ to: "/" });
    },
    onError: () => {
      toast.error(t("impersonation.stopError"));
    },
  });
}
