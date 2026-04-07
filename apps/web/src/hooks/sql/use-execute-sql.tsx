import { useMutation } from "@tanstack/react-query";

import { executeSqlMutationOptions } from "@/api/sql/sql.mutations";

export function useExecuteSql() {
  return useMutation(executeSqlMutationOptions);
}
