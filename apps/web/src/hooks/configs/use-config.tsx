import { useQuery } from "@tanstack/react-query";

import { configQueryOptions } from "@/api/configs/configs.queries";

export function useConfig(key: string) {
  return useQuery({ ...configQueryOptions(key) });
}
