import { password } from "bun";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { randomBytes } from "node:crypto";

import { getClientInfo } from "@/helpers/get-client-info";
import { createAccessToken, createRefreshToken, getCookieSettings, REFRESH_TOKEN_EXPIRATION_SECONDS } from "@/lib/jwt";
import { requirePermissionFactory } from "@/middlewares/access-control";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import {
  createInvitation,
  deleteInvitation,
  getInvitationByToken,
  getInvitations,
  getPendingInvitationByEmail,
  updateInvitation,
} from "~shared/queries/invitations.queries";
import { getDefaultRole } from "~shared/queries/roles.queries";
import { insertToken } from "~shared/queries/tokens.queries";
import { createUserRole } from "~shared/queries/user-roles.queries";
import { createUser, emailExists } from "~shared/queries/users.queries";
import { AcceptInvitationSchema, CreateInvitationSchema, InvitationRelationsQuerySchema } from "~shared/schemas/api/invitations.schemas";

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

    try {
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
      });

      const defaultRole = await getDefaultRole();
      if (defaultRole) {
        await createUserRole({ userId: insertedUser.id, roleId: defaultRole.id });
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

      return c.json({ success: true as const });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
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
  .get("/validate/:token", async (c) => {
    const token = c.req.param("token");

    try {
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
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  // --- All routes below this point require authentication
  .use(getSessionContext)

  /**
   * Get all invitations with optional relation includes
   *
   * @param c - The Hono context object with session context
   * @returns JSON response containing all invitations
   * @throws {500} If an error occurs while retrieving invitations
   * @access protected
   * @permission invitation:list
   */
  .get("/", validationMiddleware("query", InvitationRelationsQuerySchema), requirePermissionFactory("invitation:list"), async (c) => {
    const { includes } = c.req.valid("query");

    try {
      const invitations = await getInvitations(includes);
      return c.json({ success: true as const, invitations });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Create a new invitation
   *
   * @param c - The Hono context object with session context
   * @returns JSON response containing the created invitation
   * @throws {400} If the email is already registered or has a pending invitation
   * @throws {500} If an error occurs during invitation creation
   * @access protected
   * @permission invitation:create
   */
  .post("/", validationMiddleware("json", CreateInvitationSchema), requirePermissionFactory("invitation:create"), async (c) => {
    const { email } = c.req.valid("json");
    const { user } = c.var.sessionContext;

    try {
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
        invitedById: user.id,
      });

      return c.json({ success: true as const, invitation });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Revoke an invitation
   *
   * @param c - The Hono context object with session context
   * @returns JSON response containing the revoked invitation
   * @throws {500} If an error occurs while revoking the invitation
   * @access protected
   * @permission invitation:revoke
   */
  .put("/:id", requirePermissionFactory("invitation:revoke"), async (c) => {
    const id = c.req.param("id");

    try {
      const invitation = await updateInvitation(id, { status: "revoked" });
      return c.json({ success: true as const, invitation });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

/**
 * Delete an invitation
 *
 * @param c - The Hono context object with session context
 * @returns JSON response containing the deleted invitation
 * @throws {500} If an error occurs while deleting the invitation
 * @access protected
 * @permission invitation:delete
 */
  .delete("/:id", requirePermissionFactory("invitation:delete"), async (c) => {
    const id = c.req.param("id");

    try {
      const invitation = await deleteInvitation(id);
      return c.json({ success: true as const, invitation });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  });
