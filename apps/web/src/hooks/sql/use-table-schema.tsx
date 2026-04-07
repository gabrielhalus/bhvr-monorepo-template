import { useQuery } from "@tanstack/react-query";

import { tableSchemaQueryOptions } from "@/api/sql/sql.queries";

export function useTableSchema() {
  return useQuery(tableSchemaQueryOptions);
}
