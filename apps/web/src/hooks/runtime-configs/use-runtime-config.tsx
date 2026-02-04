import { useQuery } from "@tanstack/react-query";

import { runtimeConfigQueryOptions } from "@/api/runtime-configs/runtime-configs.queries";

export function useRuntimeConfig(key: string) {
  return useQuery({ ...runtimeConfigQueryOptions(key) });
}
