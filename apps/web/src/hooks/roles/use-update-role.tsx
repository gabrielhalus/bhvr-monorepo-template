import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { rolesKeys } from "@/api/roles/roles.keys";
import { updateRoleMutationOptions } from "@/api/roles/roles.mutations";

export function useUpdateRole() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...updateRoleMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      toast.success(t("pages.roles.actions.updateSuccess"));
    },
    onError: () => {
      toast.error(t("pages.roles.actions.updateError"));
    },
  });
}
