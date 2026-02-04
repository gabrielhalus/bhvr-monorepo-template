import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { invitationsKeys } from "@/api/invitations/invitations.keys";
import { createInvitationMutationOptions } from "@/api/invitations/invitations.mutations";

export function useCreateInvitation() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...createInvitationMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.paginated });
    },
    onError: (error) => {
      toast.error(error.message ?? t("pages.users.invite.createError"));
    },
  });
}
