import { queryOptions } from "@tanstack/react-query";

import { QUERY_STALE_TIMES } from "../query-config";
import { fetchSqlSheets, fetchTableSchema } from "./sql.api";
import { sqlKeys } from "./sql.keys";

export const sqlSheetsQueryOptions = queryOptions({
  queryKey: sqlKeys.sheets,
  queryFn: fetchSqlSheets,
  staleTime: QUERY_STALE_TIMES.SINGLE_ITEM,
});

export const tableSchemaQueryOptions = queryOptions({
  queryKey: sqlKeys.tableSchema,
  queryFn: fetchTableSchema,
  staleTime: QUERY_STALE_TIMES.RUNTIME_CONFIG,
});
