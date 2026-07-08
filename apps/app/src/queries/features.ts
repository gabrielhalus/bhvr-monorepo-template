import type { FeatureFlagKey } from "~shared/feature-flags.registry";

import { queryOptions } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/http";

import { QUERY_STALE_TIMES } from "../api/query-config";

export type ResolvedFeatures = Record<FeatureFlagKey, boolean>;

export const featuresQueryOptions = queryOptions({
  queryKey: ["features"],
  queryFn: async (): Promise<ResolvedFeatures> => {
    const res = await api.features.$get();
    if (!res.ok) throw await ApiError.fromResponse(res);
    const body = await res.json();
    return body.features as ResolvedFeatures;
  },
  staleTime: QUERY_STALE_TIMES.RUNTIME_CONFIG,
});
