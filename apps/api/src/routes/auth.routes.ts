import { password } from "bun";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";

import { getClientInfo } from "@/helpers/get-client-info";
import { createAccessToken, createRefreshToken, getCookieSettings, REFRESH_TOKEN_EXPIRATION_SECONDS, verifyToken } from "@/lib/jwt";
import { getSessionContext } from "@/middlewares/auth";
import { rateLimiter, rateLimitPresets } from "@/middlewares/rate-limit";
import { validationMiddleware } from "@/middlewares/validation";
import { isAuthorized } from "~shared/auth";
import {
  logAccountUpdate,
  logImpersonationStart,
  logImpersonationStop,
  logLogin,
  logLoginFailed,
  logLogout,
  logRegister,
} from "~shared/queries/audit-logs.queries";
import { getDefaultRole } from "~shared/queries/roles.queries";
import { deleteToken, insertToken } from "~shared/queries/tokens.queries";
import { createUserRole } from "~shared/queries/user-roles.queries";
import { createUser, getUser, signIn, updateUser } from "~shared/queries/users.queries";
import { isAuthorizedSchema, LoginSchema, RegisterSchema, UpdateAccountSchema } from "~shared/schemas/api/auth.schemas";

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

      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
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
    const { email, password } = c.req.valid("json");
    const clientInfo = getClientInfo(c);

    try {
      const userId = await signIn(email, password);
      if (!userId) {
        // Audit log: failed login attempt
        await logLoginFailed(email, clientInfo);
        return c.json({ success: false as const, error: "Invalid credentials" }, 200);
      }

      const insertedToken = await insertToken({
        userId,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_SECONDS * 1000).toISOString(),
        ...clientInfo,
      });

      const accessToken = await createAccessToken(userId);
      setCookie(c, "accessToken", accessToken, getCookieSettings("access"));

      const refreshToken = await createRefreshToken(userId, insertedToken.id);
      setCookie(c, "refreshToken", refreshToken, getCookieSettings("refresh"));

      // Audit log: successful login
      await logLogin(userId, clientInfo);

      return c.json({ success: true as const });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
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

    // Try to get user ID from access token for audit logging
    if (accessToken) {
      try {
        const payload = await verifyToken(accessToken, "access");
        userId = payload?.sub;
      } catch {
        // Token invalid or expired, continue with logout
      }
    }

    if (refreshToken) {
      try {
        const payload = await verifyToken(refreshToken, "refresh");
        if (payload?.jti) {
          await deleteToken(payload.jti);
        }
        // Get user ID from refresh token if not already set
        if (!userId) {
          userId = payload?.sub;
        }
      } catch {
        return c.json({ success: false as const, error: "Failed to delete refresh token" }, 401);
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

    try {
      const user = await updateUser(sessionContext.user.id, data);

      // Audit log: account update (tracks impersonation if active)
      await logAccountUpdate({
        actorId: sessionContext.user.id,
        impersonatorId: sessionContext.impersonator?.id,
        ...clientInfo,
      }, data);

      return c.json({ success: true as const, user });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Check if the authenticated user is authorized to perform an action on a resource
   *
   * @param c - The Hono context object with session context
   * @returns JSON response indicating whether the user is authorized
   * @throws {500} If an error occurs during authorization check
   * @access protected
   */
  .post("/authorize", validationMiddleware("json", isAuthorizedSchema), async (c) => {
    const sessionContext = c.var.sessionContext;
    const { permission, resource } = c.req.valid("json");

    try {
      const authorize = await isAuthorized(permission, sessionContext.user, resource);

      return c.json({ success: true as const, authorize });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
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
  .post("/impersonate/:id{^[a-zA-Z0-9-]{21}$}", async (c) => {
    const sessionContext = c.var.sessionContext;
    const targetUserId = c.req.param("id");

    try {
      // Cannot impersonate while already impersonating
      if (sessionContext.impersonator) {
        return c.json({ success: false as const, error: "Already impersonating a user. Stop impersonation first." }, 400);
      }

      // Cannot impersonate self
      if (sessionContext.user.id === targetUserId) {
        return c.json({ success: false as const, error: "Cannot impersonate yourself" }, 400);
      }

      // Check if user has impersonate permission
      const canImpersonate = await isAuthorized("user:impersonate", sessionContext.user, { id: targetUserId });
      if (!canImpersonate) {
        return c.json({ success: false as const, error: "Forbidden" }, 403);
      }

      // Get target user
      const targetUser = await getUser(targetUserId, ["roles"]);
      if (!targetUser) {
        return c.json({ success: false as const, error: "User not found" }, 404);
      }

      // Create new access token with impersonator info
      const accessToken = await createAccessToken(targetUserId, sessionContext.user.id);
      setCookie(c, "accessToken", accessToken, getCookieSettings("access"));

      // Audit log: impersonation started
      const clientInfo = getClientInfo(c);
      await logImpersonationStart(sessionContext.user.id, targetUserId, clientInfo);

      return c.json({ success: true as const, user: targetUser });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
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

    try {
      // Check if currently impersonating
      if (!sessionContext.impersonator) {
        return c.json({ success: false as const, error: "Not currently impersonating" }, 400);
      }

      // Create new access token for the original user (the impersonator)
      const accessToken = await createAccessToken(sessionContext.impersonator.id);
      setCookie(c, "accessToken", accessToken, getCookieSettings("access"));

      // Audit log: impersonation stopped
      const clientInfo = getClientInfo(c);
      await logImpersonationStop(sessionContext.impersonator.id, sessionContext.user.id, clientInfo);

      return c.json({ success: true as const, user: sessionContext.impersonator });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  });
