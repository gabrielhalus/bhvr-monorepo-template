import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteSqlSheetMutationOptions } from "@/api/sql/sql.mutations";

export function useDeleteSqlSheet() {
  const queryClient = useQueryClient();
  return useMutation(deleteSqlSheetMutationOptions(queryClient));
}
