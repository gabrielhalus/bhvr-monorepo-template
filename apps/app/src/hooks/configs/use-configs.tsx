import { useQuery } from "@tanstack/react-query";

import { configsQueryOptions } from "@/api/configs/configs.queries";

export function useConfigs() {
  return useQuery({ ...configsQueryOptions });
}
