import { queryOptions } from "@tanstack/react-query";

import { api } from "~react/lib/http";

export const getRuntimeConfigsQueryOptions = queryOptions({
  queryKey: ["get-runtime-configs"],
  queryFn: async () => {
    const res = await api.config.$get();

    if (!res.ok) {
      throw new Error("Failed to fetch configurations");
    }

    return res.json();
  },
  staleTime: 1000 * 60 * 5,
});

export function getRuntimeConfigQueryOptions(key: string) {
  return queryOptions({
    queryKey: ["get-runtime-config", key],
    queryFn: async () => {
      const res = await api.config[":key"].$get({ param: { key } });

      if (!res.ok) {
        throw new Error(`Failed to fetch configuration "${key}"`);
      }

      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}
