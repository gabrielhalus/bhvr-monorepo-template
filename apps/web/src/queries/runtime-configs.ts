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
