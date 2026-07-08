import type { OrgContext } from "@/middlewares/org-context";
import type { OrganizationMember } from "~shared/types/db/organizations.types";
import type { UserWithRelations } from "~shared/types/db/users.types";
import type { OrgId } from "~shared/types/org.types";
import type { Context } from "hono";

import { createFactory } from "hono/factory";
import { HTTPException } from "hono/http-exception";

export type AppEnv = {
  Variables: {
    orgContext: OrgContext;
    sessionContext: {
      user: UserWithRelations<["roles"]>;
      membership?: OrganizationMember;
      impersonator?: UserWithRelations<["roles"]>;
    };
  };
};

export const factory = createFactory<AppEnv>();

export type AppContext = Context<AppEnv, string, object>;

/**
 * Get the resolved organization id, or fail the request. Routes on the org
 * surface use this as the only way to obtain an `OrgId`.
 *
 * Accepts any context because `orgContext` is set by a global middleware that
 * sub-routers don't see in their env type.
 * @param c - The Hono context object.
 * @returns The organization id of the current request.
 * @throws A 404 HTTPException when the request targets the platform surface.
 */
export function requireOrg(c: Context<any, any, any>): OrgId {
  const orgContext = getOrgContext(c);

  if (!orgContext) {
    throw new HTTPException(404, { message: "Not Found" });
  }

  return orgContext.org.id as OrgId;
}

/**
 * Read the resolved org context from any route context (sub-routers don't
 * see the globally-set variable in their env type).
 * @param c - The Hono context object.
 * @returns The org context, or null on the platform surface.
 */
export function getOrgContext(c: Context<any, any, any>): OrgContext {
  return (c.get("orgContext") ?? null) as OrgContext;
}
