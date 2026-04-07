import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateSqlSheetMutationOptions } from "@/api/sql/sql.mutations";

export function useUpdateSqlSheet() {
  const queryClient = useQueryClient();
  return useMutation(updateSqlSheetMutationOptions(queryClient));
}
