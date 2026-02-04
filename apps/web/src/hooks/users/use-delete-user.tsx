import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { usersKeys } from "@/api/users/users.keys";
import { deleteUserMutationOptions } from "@/api/users/users.mutations";

export function useDeleteUser() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteUserMutationOptions(queryClient),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: usersKeys.byId(id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.paginated });
      toast.success(t("pages.users.actions.deleteUserSuccess"));
    },
    onError: () => {
      toast.error(t("pages.users.actions.deleteUserError"));
    },
  });
}
