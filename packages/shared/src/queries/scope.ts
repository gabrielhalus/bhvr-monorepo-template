import type { OrgId } from "../types/org.types";
import type { SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import { and, eq } from "drizzle-orm";

/**
 * Build a WHERE clause scoped to an organization. Every condition on an
 * org-scoped table must be assembled through this helper — combined with the
 * branded `OrgId` (only produced by the org-resolution middleware), it makes
 * an unscoped tenant query a compile error instead of a data leak.
 * @param model - A model with an `organizationId` column.
 * @param model.organizationId - The org column used for scoping.
 * @param orgId - The organization id.
 * @param conds - Additional conditions, combined with AND.
 * @returns The combined WHERE clause.
 */
export function orgScope(model: { organizationId: AnyPgColumn }, orgId: OrgId, ...conds: (SQL | undefined)[]): SQL {
  return and(eq(model.organizationId, orgId), ...conds)!;
}
