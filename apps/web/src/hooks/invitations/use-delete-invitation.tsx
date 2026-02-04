import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { invitationsKeys } from "@/api/invitations/invitations.keys";
import { deleteInvitationMutationOptions } from "@/api/invitations/invitations.mutations";

export function useDeleteInvitation() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteInvitationMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.paginated });
      toast.success(t("pages.users.actions.deleteInvitationSuccess"));
    },
    onError: () => {
      toast.error(t("pages.users.actions.deleteInvitationError"));
    },
  });
}
