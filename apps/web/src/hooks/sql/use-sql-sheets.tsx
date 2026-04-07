import { useQuery } from "@tanstack/react-query";

import { sqlSheetsQueryOptions } from "@/api/sql/sql.queries";

export function useSqlSheets() {
  return useQuery(sqlSheetsQueryOptions);
}
