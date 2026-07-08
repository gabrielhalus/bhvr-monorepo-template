import type { OrgId } from "~shared/types/org.types";

import { Hono } from "hono";

import { getOrgContext } from "@/utils/hono";
import { resolveFeatureFlags } from "~shared/queries/feature-flags.queries";

export const featuresRoutes = new Hono()
  /**
   * Resolved feature flags for the current surface (org or platform).
   * Public: the login screen already needs them (auth methods, registration).
   *
   * @param c - The Hono context object
   * @returns JSON response with the resolved flag map
   * @access public
   */
  .get("/", async (c) => {
    const orgContext = getOrgContext(c);
    const features = await resolveFeatureFlags((orgContext?.org.id ?? null) as OrgId | null);

    return c.json({ success: true as const, features });
  });
