import type { FeatureFlagKey } from "~shared/feature-flags.registry";

import { useQuery } from "@tanstack/react-query";

import { featuresQueryOptions } from "@/queries/features";

/**
 * Whether a feature flag is enabled for the current organization.
 * Returns undefined while the flag map is loading — hide the gated UI until
 * the value is known rather than flashing it.
 */
export function useFeature(flag: FeatureFlagKey): boolean | undefined {
  const { data } = useQuery(featuresQueryOptions);
  return data?.[flag];
}
