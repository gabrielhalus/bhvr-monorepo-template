import { useQuery } from "@tanstack/react-query";

import { backupsQueryOptions } from "@/api/backup/backup.queries";

export function useBackups() {
  return useQuery(backupsQueryOptions);
}
