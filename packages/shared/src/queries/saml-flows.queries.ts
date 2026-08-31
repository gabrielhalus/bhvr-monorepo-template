import { and, eq, gt, isNull, lt } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { SamlFlowsModel } from "../models/saml-flows.model";
import { SamlFlowSchema } from "../schemas/db/saml-flows.schemas";

// ============================================================================
// Core Operations
// ============================================================================

/**
 * Record a SAML authentication request so its assertion can be matched back.
 * @param data - The flow to record.
 * @param data.requestId - The `ID` of the AuthnRequest sent to the IdP.
 * @param data.mode - How the callback should be interpreted.
 * @param data.redirectTo - Where to land once the session is open.
 * @param data.linkToken - The pending link being confirmed, in confirm-link mode.
 * @param data.expiresAt - When the flow stops being acceptable.
 * @returns The created flow record.
 */
export async function createSamlFlow(data: {
  requestId: string;
  mode: string;
  redirectTo: string;
  linkToken?: string;
  expiresAt: Date;
}) {
  const [row] = await drizzle
    .insert(SamlFlowsModel)
    .values({ ...data, expiresAt: data.expiresAt.toISOString() })
    .returning();

  if (!row) {
    throw new Error("Failed to create SAML flow");
  }

  return SamlFlowSchema.parse(row);
}

/**
 * Consume the flow matching an assertion's `InResponseTo`.
 *
 * The update is conditional on the row still being unconsumed and unexpired,
 * so a replayed assertion finds nothing to consume and is rejected — the
 * atomicity is what makes this a replay guard rather than a lookup.
 *
 * @param requestId - The `InResponseTo` value carried by the assertion.
 * @returns The flow record, or null if unknown, already consumed, or expired.
 */
export async function consumeSamlFlow(requestId: string) {
  const [row] = await drizzle
    .update(SamlFlowsModel)
    .set({ consumedAt: new Date().toISOString() })
    .where(and(
      eq(SamlFlowsModel.requestId, requestId),
      isNull(SamlFlowsModel.consumedAt),
      gt(SamlFlowsModel.expiresAt, new Date().toISOString()),
    ))
    .returning();

  if (!row) {
    return null;
  }

  return SamlFlowSchema.parse(row);
}

/**
 * Delete flows past their expiry, consumed or not.
 * @returns The number of rows removed.
 */
export async function deleteExpiredSamlFlows() {
  const rows = await drizzle
    .delete(SamlFlowsModel)
    .where(lt(SamlFlowsModel.expiresAt, new Date().toISOString()))
    .returning({ id: SamlFlowsModel.id });

  return rows.length;
}
