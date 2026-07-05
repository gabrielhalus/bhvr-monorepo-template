import { queryOptions } from "@tanstack/react-query";

import { QUERY_STALE_TIMES } from "../query-config";
import { fetchLocalBackups, fetchS3Backups } from "./backup.api";
import { backupKeys } from "./backup.keys";

export const backupsQueryOptions = queryOptions({
  queryKey: backupKeys.list,
  queryFn: fetchS3Backups,
  staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
});

export const localBackupsQueryOptions = queryOptions({
  queryKey: backupKeys.localList,
  queryFn: fetchLocalBackups,
  staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
});
