import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { usersKeys } from "@/api/users/users.keys";
import { updateUserRolesMutationOptions } from "@/api/users/users.mutations";

export function useUpdateUserRoles() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...updateUserRolesMutationOptions(queryClient),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.paginated });
      queryClient.invalidateQueries({ queryKey: ["users", "relations"] });
      toast.success(t("users.detail.sections.roles.updateSuccess"));
    },
    meta: { errorMessage: t("users.detail.sections.roles.updateError") },
  });
}
