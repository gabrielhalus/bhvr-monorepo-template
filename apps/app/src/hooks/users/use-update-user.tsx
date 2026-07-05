import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { usersKeys } from "@/api/users/users.keys";
import { updateUserMutationOptions } from "@/api/users/users.mutations";

export function useUpdateUser() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...updateUserMutationOptions(queryClient),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.paginated });
      toast.success(t("users.actions.updateUserSuccess"));
    },
    meta: { errorMessage: t("users.actions.updateUserError") },
  });
}
