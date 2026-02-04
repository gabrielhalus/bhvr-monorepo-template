import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { rolesKeys } from "@/api/roles/roles.keys";
import { usersKeys } from "@/api/users/users.keys";
import { removeRoleMembersMutationOptions } from "@/api/roles/roles.mutations";

export function useRemoveRoleMembers(roleName: string) {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...removeRoleMembersMutationOptions(queryClient, roleName),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.byName(roleName, ["members"]) });
      queryClient.invalidateQueries({ queryKey: rolesKeys._relations });
      queryClient.invalidateQueries({ queryKey: usersKeys.relations(variables.userIds, ["roles"]) });
      toast.success(t("pages.roles.detail.pages.members.removeSuccess"));
    },
    onError: () => {
      toast.error(t("pages.roles.detail.pages.members.removeError"));
    },
  });
}
