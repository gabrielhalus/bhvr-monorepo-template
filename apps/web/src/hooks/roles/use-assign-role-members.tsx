import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { rolesKeys } from "@/api/roles/roles.keys";
import { assignRoleMembersMutationOptions } from "@/api/roles/roles.mutations";

export function useAssignRoleMembers(roleName: string) {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...assignRoleMembersMutationOptions(queryClient, roleName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.byName(roleName, ["members"]) });
      queryClient.invalidateQueries({ queryKey: rolesKeys._relations });
      toast.success(t("pages.roles.detail.pages.members.assignSuccess"));
    },
    onError: () => {
      toast.error(t("pages.roles.detail.pages.members.assignError"));
    },
  });
}
