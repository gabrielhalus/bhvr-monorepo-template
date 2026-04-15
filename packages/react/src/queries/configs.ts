import type { InferResponseType } from "hono";

import { queryOptions } from "@tanstack/react-query";

import { api } from "~react/lib/http";

export const configsQueryOptions = queryOptions({
  queryKey: ["configs", "list"],
  queryFn: async (): Promise<InferResponseType<typeof api.config.$get>> => {
    const res = await api.config.$get();

    if (!res.ok) {
      throw new Error("Failed to fetch configurations");
    }

    return res.json();
  },
  staleTime: 10 * 60 * 1000,
  retry: false,
});
