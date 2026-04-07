import type { QueryClient } from "@tanstack/react-query";

import {
  createSqlSheetRequest,
  deleteSqlSheetRequest,
  executeSql,
  updateSqlSheetRequest,
} from "./sql.api";
import { sqlKeys } from "./sql.keys";

// ============================================================================
// Mutation Options
// ============================================================================

export const executeSqlMutationOptions = {
  mutationFn: (query: string) => executeSql(query),
};

export function createSqlSheetMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (data: { name: string; query: string }) => createSqlSheetRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sqlKeys.sheets });
    },
  };
}

export function updateSqlSheetMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ id, data }: { id: string; data: { name?: string; query?: string } }) =>
      updateSqlSheetRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sqlKeys.sheets });
    },
  };
}

export function deleteSqlSheetMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (id: string) => deleteSqlSheetRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sqlKeys.sheets });
    },
  };
}
