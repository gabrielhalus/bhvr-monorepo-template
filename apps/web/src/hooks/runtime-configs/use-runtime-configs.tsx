import { useQuery } from "@tanstack/react-query";

import { runtimeConfigsQueryOptions } from "@/api/runtime-configs/runtime-configs.queries";

export function useRuntimeConfigs() {
  return useQuery({ ...runtimeConfigsQueryOptions });
}
