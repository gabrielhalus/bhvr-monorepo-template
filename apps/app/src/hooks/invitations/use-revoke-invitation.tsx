import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { invitationsKeys } from "@/api/invitations/invitations.keys";
import { revokeInvitationMutationOptions } from "@/api/invitations/invitations.mutations";

export function useRevokeInvitation() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...revokeInvitationMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.paginated });
      toast.success(t("users.actions.revokeInvitationSuccess"));
    },
    meta: { errorMessage: t("users.actions.revokeInvitationError") },
  });
}
