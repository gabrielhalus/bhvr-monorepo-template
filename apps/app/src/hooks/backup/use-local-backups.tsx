import { useQuery } from "@tanstack/react-query";

import { localBackupsQueryOptions } from "@/api/backup/backup.queries";

export function useLocalBackups() {
  return useQuery(localBackupsQueryOptions);
}
