import { password } from "bun";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";

import { getClientInfo } from "@/helpers/get-client-info";
import { createAccessToken, createRefreshToken, getCookieSettings, REFRESH_TOKEN_EXPIRATION_SECONDS, verifyToken } from "@/lib/jwt";
import { getSessionContext } from "@/middlewares/auth";
import { rateLimiter, rateLimitPresets } from "@/middlewares/rate-limit";
import { validationMiddleware } from "@/middlewares/validation";
import { isAuthorized, isAuthorizedBatch } from "~shared/auth";
import {
  logAccountPasswordChange,
  logAccountUpdate,
  logImpersonationStart,
  logImpersonationStop,
  logLogin,
  logLoginFailed,
  logLogout,
  logRegister,
  logSessionRevokeAll,
  logTokenRevoke,
} from "~shared/queries/audit-logs.queries";
import { getDefaultRole } from "~shared/queries/roles.queries";
import { deleteToken, getActiveTokensByUserId, insertToken, revokeAllTokensByUserId, revokeAllTokensByUserIdExcept, revokeToken } from "~shared/queries/tokens.queries";
import { createUserRole } from "~shared/queries/user-roles.queries";
import { createUser, getUser, signIn, updateUser, updateUserPassword } from "~shared/queries/users.queries";
import { ChangePasswordSchema, isAuthorizedSchema, LoginSchema, RegisterSchema, UpdateAccountSchema, UpdatePreferencesSchema } from "~shared/schemas/api/auth.schemas";
import { UserPreferencesSchema } from "~shared/schemas/db/users.schemas";

export const authRoutes = new Hono()
  /**
   * Register a new user
   *
   * @param c - The Hono context object
   * @returns JSON response indicating success or failure of user registration
   * @throws {400} If the email is already taken
   * @throws {500} If an error occurs during user creation or token generation
   * @access public
   */
  .post("/register", rateLimiter(rateLimitPresets.register), validationMiddleware("json", RegisterSchema), async (c) => {
    const user = c.req.valid("json");
    const hashedPassword = await password.hash(user.password);
    const clientInfo = getClientInfo(c);

    try {
      const insertedUser = await createUser({ ...user, password: hashedPassword });

      const defaultRole = await getDefaultRole();
      if (defaultRole) {
        await createUserRole({ userId: insertedUser.id, roleId: defaultRole.id });
      }

      const insertedToken = await insertToken({
        userId: insertedUser.id,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_SECONDS * 1000).toISOString(),
        ...clientInfo,
      });

      const accessToken = await createAccessToken(insertedUser.id);
      setCookie(c, "accessToken", accessToken, getCookieSettings("access"));

      const refreshToken = await createRefreshToken(insertedUser.id, insertedToken.id);
      setCookie(c, "refreshToken", refreshToken, getCookieSettings("refresh"));

      // Audit log: user registration
      await logRegister(insertedUser.id, clientInfo);

      return c.json({ success: true as const });
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed: users.email")) {
        return c.json({ success: false as const, error: "Email is already taken" }, 400);
      }
      throw error;
    }
  })

  /**
   * Login a user
   *
   * @param c - The Hono context object
   * @returns JSON response with success status and authentication tokens set as cookies
   * @throws {200} If the credentials are invalid (returns success: false)
   * @throws {500} If an error occurs during authentication or token generation
   * @access public
   */
  .post("/login", rateLimiter(rateLimitPresets.login), validationMiddleware("json", LoginSchema), async (c) => {
    const MIN_RESPONSE_TIME_MS = 500;

    const start = performance.now();

    const { email, password } = c.req.valid("json");
    const clientInfo = getClientInfo(c);

    let success = false;
    let userId: string | null = null;

    userId = await signIn(email, password);

    if (!userId) {
      await logLoginFailed(email, clientInfo);
    } else {
      const insertedToken = await insertToken({
        userId,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + REFRESH_TOKEN_EXPIRATION_SECONDS * 1000,
        ).toISOString(),
        ...clientInfo,
      });

      const accessToken = await createAccessToken(userId);
      setCookie(c, "accessToken", accessToken, getCookieSettings("access"));

      const refreshToken = await createRefreshToken(
        userId,
        insertedToken.id,
      );
      setCookie(c, "refreshToken", refreshToken, getCookieSettings("refresh"));

      await logLogin(userId, clientInfo);

      success = true;
    }

    //  Constant-time floor
    const elapsed = performance.now() - start;
    const remaining = MIN_RESPONSE_TIME_MS - elapsed;

    if (remaining > 0) {
      await Bun.sleep(remaining);
    }

    if (!success) {
      return c.json(
        { success: false as const, error: "Invalid credentials" },
        200,
      );
    }

    return c.json({ success: true as const });
  })

  /**
   * Logout a user by clearing the refresh token cookie and invalidating the refresh token
   *
   * @param c - The Hono context object
   * @returns JSON response indicating successful logout
   * @throws {401} If the refresh token verification or deletion fails
   * @access public
   */
  .post("/logout", async (c) => {
    const refreshToken = getCookie(c, "refreshToken");
    const accessToken = getCookie(c, "accessToken");
    const clientInfo = getClientInfo(c);
    let userId: string | undefined;

    if (accessToken) {
      try {
        const payload = await verifyToken(accessToken, "access");
        userId = payload?.sub;
      } catch {
        // Token invalid or expired, continue with logout
      }
    }

    if (refreshToken) {
      const payload = await verifyToken(refreshToken, "refresh");
      if (payload?.jti) {
        await deleteToken(payload.jti);
      }
      // Get user ID from refresh token if not already set
      if (!userId) {
        userId = payload?.sub;
      }
    }

    setCookie(c, "accessToken", "", getCookieSettings("clear"));
    setCookie(c, "refreshToken", "", getCookieSettings("clear"));

    // Audit log: logout (if we could identify the user)
    if (userId) {
      await logLogout({ actorId: userId, ...clientInfo });
    }

    return c.json({ success: true as const });
  })

  // --- All routes below this point require authentication
  .use(getSessionContext)

  /**
   * Get the authenticated user's session information
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the authenticated user's session data (including impersonator if impersonating)
   * @access protected
   */
  .get("/", async (c) => {
    const sessionContext = c.var.sessionContext;
    return c.json({
      success: true as const,
      user: sessionContext.user,
      ...(sessionContext.impersonator && { impersonator: sessionContext.impersonator }),
    });
  })

  /**
   * Update the authenticated user's account information
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the updated user data
   * @throws {500} If an error occurs while updating the account
   * @access protected
   */
  .put("/account", validationMiddleware("json", UpdateAccountSchema), async (c) => {
    const sessionContext = c.var.sessionContext;
    const data = c.req.valid("json");
    const clientInfo = getClientInfo(c);

    const user = await updateUser(sessionContext.user.id, data);

    // Audit log: account update (tracks impersonation if active)
    await logAccountUpdate({
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    }, data);

    return c.json({ success: true as const, user });
  })

  /**
   * Update the authenticated user's preferences (sidebar, theme, locale)
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the updated user data
   * @access protected
   */
  .patch("/preferences", validationMiddleware("json", UpdatePreferencesSchema), async (c) => {
    const sessionContext = c.var.sessionContext;
    const data = c.req.valid("json");

    const currentPreferences = UserPreferencesSchema.catch(null).parse(sessionContext.user.preferences);
    const updatedPreferences = { ...(currentPreferences ?? {}), ...data };

    const user = await updateUser(sessionContext.user.id, { preferences: updatedPreferences });

    return c.json({ success: true as const, user });
  })

  /**
   * Change the authenticated user's password
   *
   * @param c - The Hono context object with session context
   * @returns JSON response indicating success or failure of password change
   * @throws {400} If the current password is incorrect
   * @throws {500} If an error occurs while changing the password
   * @access protected
   */
  .put("/account/password", validationMiddleware("json", ChangePasswordSchema), async (c) => {
    const sessionContext = c.var.sessionContext;
    const { currentPassword, newPassword } = c.req.valid("json");
    const clientInfo = getClientInfo(c);

    const user = await getUser(sessionContext.user.id);
    if (!user || !user.password) {
      return c.json({ success: false as const, error: "User not found" }, 404);
    }

    const isValidPassword = await password.verify(currentPassword, user.password);
    if (!isValidPassword) {
      return c.json({ success: false as const, error: "Current password is incorrect" }, 400);
    }

    const hashedPassword = await password.hash(newPassword);
    await updateUserPassword(sessionContext.user.id, hashedPassword);

    // Revoke all sessions except the current one after password change
    const refreshToken = getCookie(c, "refreshToken");
    if (refreshToken) {
      try {
        const payload = await verifyToken(refreshToken, "refresh");
        if (payload?.jti) {
          await revokeAllTokensByUserIdExcept(sessionContext.user.id, payload.jti);
        }
      } catch {
        // Best-effort: skip if token cannot be parsed
      }
    }

    await logAccountPasswordChange({
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    });

    return c.json({ success: true as const });
  })

  /**
   * Check if the authenticated user is authorized to perform one or more actions
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with a results array (one boolean per check)
   * @access protected
   */
  .post("/authorize", validationMiddleware("json", isAuthorizedSchema), async (c) => {
    const sessionContext = c.var.sessionContext;
    const { checks } = c.req.valid("json");

    const results = await isAuthorizedBatch(checks, sessionContext.user);

    return c.json({ success: true as const, results });
  })

  /**
   * Start impersonating another user
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with new access token for impersonated user
   * @throws {403} If user doesn't have impersonate permission
   * @throws {404} If target user is not found
   * @throws {400} If already impersonating or trying to impersonate self
   * @access protected
   * @permission user:impersonate
   */
  .post("/impersonate/:id{[a-zA-Z0-9-]{21}}", async (c) => {
    const sessionContext = c.var.sessionContext;
    const targetUserId = c.req.param("id");

    if (sessionContext.impersonator) {
      return c.json({ success: false as const, error: "Already impersonating a user. Stop impersonation first." }, 400);
    }

    if (sessionContext.user.id === targetUserId) {
      return c.json({ success: false as const, error: "Cannot impersonate yourself" }, 400);
    }

    const canImpersonate = await isAuthorized("user:impersonate", sessionContext.user, { id: targetUserId });
    if (!canImpersonate) {
      return c.json({ success: false as const, error: "Forbidden" }, 403);
    }

    const targetUser = await getUser(targetUserId, ["roles"]);
    if (!targetUser) {
      return c.json({ success: false as const, error: "User not found" }, 404);
    }

    const accessToken = await createAccessToken(targetUserId, sessionContext.user.id);
    setCookie(c, "accessToken", accessToken, getCookieSettings("access"));

    const clientInfo = getClientInfo(c);
    await logImpersonationStart(sessionContext.user.id, targetUserId, clientInfo);

    return c.json({ success: true as const, user: targetUser });
  })

  /**
   * Stop impersonating and return to original user
   *
   * @param c - The Hono context object with session context
   * @returns JSON response confirming impersonation has stopped
   * @throws {400} If not currently impersonating
   * @access protected
   */
  .post("/stop-impersonation", async (c) => {
    const sessionContext = c.var.sessionContext;

    if (!sessionContext.impersonator) {
      return c.json({ success: false as const, error: "Not currently impersonating" }, 400);
    }

    const accessToken = await createAccessToken(sessionContext.impersonator.id);
    setCookie(c, "accessToken", accessToken, getCookieSettings("access"));

    const clientInfo = getClientInfo(c);
    await logImpersonationStop(sessionContext.impersonator.id, sessionContext.user.id, clientInfo);

    return c.json({ success: true as const, user: sessionContext.impersonator });
  })

  /**
   * Get all active sessions for the authenticated user
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with list of active sessions and isCurrent flag
   * @access protected
   */
  .get("/sessions", async (c) => {
    const sessionContext = c.var.sessionContext;
    const refreshToken = getCookie(c, "refreshToken");

    let currentTokenId: string | undefined;
    if (refreshToken) {
      try {
        const payload = await verifyToken(refreshToken, "refresh");
        currentTokenId = payload?.jti;
      } catch {
        // ignore
      }
    }

    try {
      const tokens = await getActiveTokensByUserId(sessionContext.user.id);
      const sessions = tokens.map(token => ({
        ...token,
        isCurrent: token.id === currentTokenId,
      }));

      return c.json({ success: true as const, sessions });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Revoke a specific session for the authenticated user
   *
   * @param c - The Hono context object with session context
   * @returns JSON response indicating success
   * @throws {403} If the token does not belong to the current user
   * @throws {404} If the token is not found
   * @access protected
   */
  .delete("/sessions/:tokenId", async (c) => {
    const sessionContext = c.var.sessionContext;
    const tokenId = c.req.param("tokenId");
    const clientInfo = getClientInfo(c);

    try {
      const tokens = await getActiveTokensByUserId(sessionContext.user.id);
      const token = tokens.find(t => t.id === tokenId);

      if (!token) {
        return c.json({ success: false as const, error: "Session not found" }, 404);
      }

      await revokeToken(tokenId);

      // If this was the current session, clear cookies
      const refreshToken = getCookie(c, "refreshToken");
      if (refreshToken) {
        try {
          const payload = await verifyToken(refreshToken, "refresh");
          if (payload?.jti === tokenId) {
            setCookie(c, "accessToken", "", getCookieSettings("clear"));
            setCookie(c, "refreshToken", "", getCookieSettings("clear"));
          }
        } catch {
          // ignore
        }
      }

      await logTokenRevoke(tokenId, {
        actorId: sessionContext.user.id,
        impersonatorId: sessionContext.impersonator?.id,
        ...clientInfo,
      });

      return c.json({ success: true as const });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Revoke all sessions for the authenticated user including the current one
   *
   * @param c - The Hono context object with session context
   * @returns JSON response indicating success
   * @access protected
   */
  .delete("/sessions", async (c) => {
    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);

    try {
      await revokeAllTokensByUserId(sessionContext.user.id);

      setCookie(c, "accessToken", "", getCookieSettings("clear"));
      setCookie(c, "refreshToken", "", getCookieSettings("clear"));

      await logSessionRevokeAll(sessionContext.user.id, {
        actorId: sessionContext.user.id,
        impersonatorId: sessionContext.impersonator?.id,
        ...clientInfo,
      });

      return c.json({ success: true as const });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  });
