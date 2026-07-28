import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { usersKeys } from "@/api/users/users.keys";
import { createUserMutationOptions } from "@/api/users/users.mutations";

export function useCreateUser() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...createUserMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.paginated });
      toast.success(t("users.actions.createUserSuccess"));
    },
    meta: { errorMessage: t("users.actions.createUserError") },
  });
}
