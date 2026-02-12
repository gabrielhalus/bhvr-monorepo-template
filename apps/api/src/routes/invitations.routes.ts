import type { InvitationRelations } from "~shared/types/db/invitations.types";

import { password } from "bun";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { randomBytes } from "node:crypto";

import { getClientInfo } from "@/helpers/get-client-info";
import { createAccessToken, createRefreshToken, getCookieSettings, REFRESH_TOKEN_EXPIRATION_SECONDS } from "@/lib/jwt";
import { requirePermissionFactory } from "@/middlewares/access-control";
import { auditList, auditRead } from "@/middlewares/audit";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { logInvitationAccept, logInvitationCreate, logInvitationDelete, logInvitationRevoke } from "~shared/queries/audit-logs.queries";
import {
  createInvitation,
  createInvitationRoles,
  deleteInvitation,
  getInvitation,
  getInvitationByToken,
  getInvitationRoleIds,
  getInvitationsPaginated,
  getPendingInvitationByEmail,
  invitationRelationLoaders,
  updateInvitation,
} from "~shared/queries/invitations.queries";
import { getDefaultRole } from "~shared/queries/roles.queries";
import { insertToken } from "~shared/queries/tokens.queries";
import { createUserRole } from "~shared/queries/user-roles.queries";
import { createUser, emailExists } from "~shared/queries/users.queries";
import { AcceptInvitationSchema, CreateInvitationSchema, InvitationRelationsQuerySchema, ValidateInvitationSchema } from "~shared/schemas/api/invitations.schemas";
import { PaginationQuerySchema } from "~shared/schemas/api/pagination.schemas";

const INVITATION_EXPIRATION_DAYS = 7;

export const invitationsRoutes = new Hono()
  /**
   * Accept an invitation and create a new user account
   *
   * @param c - The Hono context object
   * @returns JSON response indicating success with authentication tokens set
   * @throws {400} If the invitation is invalid, expired, or email already registered
   * @throws {500} If an error occurs during account creation
   * @access public
   */
  .post("/accept", validationMiddleware("json", AcceptInvitationSchema), async (c) => {
    const { token, name, password: rawPassword } = c.req.valid("json");

    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return c.json({ success: false as const, error: "Invalid invitation token" }, 400);
    }

    if (invitation.status !== "pending") {
      return c.json({ success: false as const, error: `Invitation has already been ${invitation.status}` }, 400);
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      await updateInvitation(invitation.id, { status: "expired" });
      return c.json({ success: false as const, error: "Invitation has expired" }, 400);
    }

    if (await emailExists(invitation.email)) {
      return c.json({ success: false as const, error: "Email is already registered" }, 400);
    }

    const hashedPassword = await password.hash(rawPassword);
    const insertedUser = await createUser({
      name,
      email: invitation.email,
      password: hashedPassword,
      verifiedAt: invitation.autoValidateEmail ? new Date().toISOString() : null,
    });

    const invitationRoleIds = await getInvitationRoleIds(invitation.id);

    if (invitationRoleIds.length > 0) {
      for (const roleId of invitationRoleIds) {
        await createUserRole({ userId: insertedUser.id, roleId });
      }
    } else {
      const defaultRole = await getDefaultRole();
      if (defaultRole) {
        await createUserRole({ userId: insertedUser.id, roleId: defaultRole.id });
      }
    }

    await updateInvitation(invitation.id, {
      status: "accepted",
      acceptedAt: new Date().toISOString(),
    });

    const insertedToken = await insertToken({
      userId: insertedUser.id,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_SECONDS * 1000).toISOString(),
      ...getClientInfo(c),
    });

    const accessToken = await createAccessToken(insertedUser.id);
    setCookie(c, "accessToken", accessToken, getCookieSettings("access"));

    const refreshToken = await createRefreshToken(insertedUser.id, insertedToken.id);
    setCookie(c, "refreshToken", refreshToken, getCookieSettings("refresh"));

    // Audit log: invitation accepted
    const clientInfo = getClientInfo(c);
    await logInvitationAccept(invitation.id, insertedUser.id, clientInfo);

    return c.json({ success: true as const });
  })

  /**
   * Validate an invitation token
   *
   * @param c - The Hono context object
   * @returns JSON response with invitation details if valid
   * @throws {400} If the invitation is invalid, expired, or already used
   * @throws {500} If an error occurs during validation
   * @access public
   */
  .get("/validate", validationMiddleware("query", ValidateInvitationSchema), async (c) => {
    const { token } = c.req.valid("query");

    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return c.json({ success: false as const, error: "Invalid invitation token" }, 400);
    }

    if (invitation.status !== "pending") {
      return c.json({ success: false as const, error: `Invitation has already been ${invitation.status}` }, 400);
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      await updateInvitation(invitation.id, { status: "expired" });
      return c.json({ success: false as const, error: "Invitation has expired" }, 400);
    }

    return c.json({
      success: true as const,
      invitation: {
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
    });
  })

  // --- All routes below this point require authentication
  .use(getSessionContext)

  /**
   * Get paginated invitations with optional relation includes
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with paginated invitations with metadata
   * @throws {500} If an error occurs while retrieving invitations
   * @access protected
   * @permission invitation:list
   */
  .get("/", validationMiddleware("query", PaginationQuerySchema), requirePermissionFactory("invitation:list"), auditList("invitation:list", "invitation"), async (c) => {
    const { page, limit, sortBy, sortOrder, search } = c.req.valid("query");

    const result = await getInvitationsPaginated({ page, limit, sortBy, sortOrder, search });
    return c.json({ success: true as const, ...result });
  })

  /**
   * Get the relations for specified invitations.
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with invitations-relations mapping
   * @throws {500} If an error occurs while retrieving relations
   * @access protected
   * @permission invitation:list
   */
  .get("/relations", validationMiddleware("query", InvitationRelationsQuerySchema), requirePermissionFactory("invitation:list"), async (c) => {
    const { invitationIds = [], include } = c.req.valid("query");

    const relations: Record<string, Partial<InvitationRelations>> = {};
    invitationIds.forEach(id => (relations[id] = {}));

    await Promise.all(
      include.map(async (key) => {
        const loader = invitationRelationLoaders[key];
        if (!loader)
          throw new Error(`No relation loader defined for "${key}"`);

        const data = await loader(invitationIds);

        for (const [invitationId, items] of Object.entries(data)) {
          relations[invitationId]![key] = items;
        }
      }),
    );

    return c.json({ success: true as const, relations });
  })

  /**
   * Get a specific invitation by ID with optional relation include
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the invitation data
   * @throws {404} If the invitation is not found
   * @throws {500} If an error occurs while retrieving the invitation
   * @access protected
   * @permission invitation:read (resource-specific)
   */
  .get("/:id{[a-zA-Z0-9-]{21}}", requirePermissionFactory("invitation:read", c => ({ id: c.req.param("id") })), auditRead("invitation:read", "invitation"), async (c) => {
    const id = c.req.param("id");

    const invitation = await getInvitation(id);

    if (!invitation) {
      return c.json({ success: false, error: "Not Found" }, 404);
    }

    return c.json({ success: true as const, invitation });
  })

/**
 * Get relations for a specific invitation.
 *
 * @param ctx - Hono context, including session info
 * @param id - Invitation ID
 * @returns JSON response with the specified invitation's relations
 * @throws {500} If an error occurs while retrieving relations
 * @access protected
 * @permission invitation:read
 */
  .get("/:id{[a-zA-Z0-9-]{21}}/relations", requirePermissionFactory("invitation:read", c => ({ id: c.req.param("id") })), validationMiddleware("query", InvitationRelationsQuerySchema), async (c) => {
    const id = c.req.param("id");
    const { include } = c.req.valid("query");

    const relations: Record<string, Partial<InvitationRelations>> = {};

    await Promise.all(
      include.map(async (key) => {
        const loader = invitationRelationLoaders[key];
        if (!loader)
          throw new Error(`No relation loader defined for "${key}"`);

        const data = await loader([id]);

        for (const [_, items] of Object.entries(data)) {
          relations[key] = items as Partial<InvitationRelations>;
        }
      }),
    );

    return c.json({ success: true as const, relations });
  })

  /**
   * Create a new invitation
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the created invitation
   * @throws {400} If the email is already registered or has a pending invitation
   * @throws {500} If an error occurs during invitation creation
   * @access protected
   * @permission invitation:create
   */
  .post("/", validationMiddleware("json", CreateInvitationSchema), requirePermissionFactory("invitation:create"), async (c) => {
    const { email, roleIds, autoValidateEmail } = c.req.valid("json");
    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);

    if (await emailExists(email)) {
      return c.json({ success: false as const, error: "Email is already registered" }, 400);
    }

    const existingInvitation = await getPendingInvitationByEmail(email);
    if (existingInvitation) {
      return c.json({ success: false as const, error: "A pending invitation already exists for this email" }, 400);
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const invitation = await createInvitation({
      email,
      token,
      expiresAt,
      invitedById: sessionContext.user.id,
      autoValidateEmail: autoValidateEmail ?? false,
    });

    if (roleIds && roleIds.length > 0) {
      await createInvitationRoles(invitation.id, roleIds);
    }

    // Audit log: invitation created (tracks impersonation if active)
    await logInvitationCreate(invitation.id, email, {
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    });

    return c.json({ success: true as const, invitation });
  })

  /**
   * Revoke an invitation
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the revoked invitation
   * @throws {500} If an error occurs while revoking the invitation
   * @access protected
   * @permission invitation:revoke
   */
  .put("/:id{[a-zA-Z0-9-]{21}}", requirePermissionFactory("invitation:revoke"), async (c) => {
    const id = c.req.param("id");
    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);

    const invitation = await updateInvitation(id, { status: "revoked" });

    // Audit log: invitation revoked (tracks impersonation if active)
    await logInvitationRevoke(id, {
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    });

    return c.json({ success: true as const, invitation });
  })

/**
 * Delete an invitation
 *
 * @param c - The Hono context object with session context
 * @returns JSON response with the deleted invitation
 * @throws {500} If an error occurs while deleting the invitation
 * @access protected
 * @permission invitation:delete
 */
  .delete("/:id{[a-zA-Z0-9-]{21}}", requirePermissionFactory("invitation:delete"), async (c) => {
    const id = c.req.param("id");
    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);

    const invitation = await deleteInvitation(id);

    // Audit log: invitation deleted (tracks impersonation if active)
    await logInvitationDelete(id, {
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    });

    return c.json({ success: true as const, invitation });
  });
