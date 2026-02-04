import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { rolesKeys } from "@/api/roles/roles.keys";
import { deleteRoleMutationOptions } from "@/api/roles/roles.mutations";

export function useDeleteRole() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteRoleMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      toast.success(t("pages.roles.actions.deleteSuccess"));
    },
    onError: () => {
      toast.error(t("pages.roles.actions.deleteError"));
    },
  });
}
