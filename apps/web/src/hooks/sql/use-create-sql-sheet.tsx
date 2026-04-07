import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createSqlSheetMutationOptions } from "@/api/sql/sql.mutations";

export function useCreateSqlSheet() {
  const queryClient = useQueryClient();
  return useMutation(createSqlSheetMutationOptions(queryClient));
}
