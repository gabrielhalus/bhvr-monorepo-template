import type { FeatureFlagKey } from "~shared/feature-flags.registry";

import { queryOptions } from "@tanstack/react-query";

import { adminApi, ApiError } from "@/lib/http";
import { QUERY_STALE_TIMES } from "~app-core/index";

export type PlatformFlag = {
  key: FeatureFlagKey;
  description: string;
  defaultEnabled: boolean;
  scope: "platform" | "organization";
  enabled: boolean;
};

export const flagsQueryOptions = queryOptions({
  queryKey: ["admin", "flags"],
  queryFn: async (): Promise<PlatformFlag[]> => {
    const res = await adminApi.admin.flags.$get();
    if (!res.ok) throw await ApiError.fromResponse(res);
    const body = await res.json();
    return body.flags as PlatformFlag[];
  },
  staleTime: QUERY_STALE_TIMES.RUNTIME_CONFIG,
});

/**
 * Set (or clear with null) a flag override — platform-wide when
 * organizationId is omitted.
 */
export async function setFlag(key: FeatureFlagKey, enabled: boolean | null, organizationId?: string): Promise<void> {
  const res = await adminApi.admin.flags.$put({ json: { key, enabled, organizationId } });
  if (!res.ok) throw await ApiError.fromResponse(res);
}
