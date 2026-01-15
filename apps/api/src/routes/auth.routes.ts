import { password } from "bun";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";

import { getClientInfo } from "@/helpers/get-client-info";
import { createAccessToken, createRefreshToken, getCookieSettings, REFRESH_TOKEN_EXPIRATION_SECONDS, verifyToken } from "@/lib/jwt";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { isAuthorized } from "~shared/auth";
import { getDefaultRole } from "~shared/queries/roles.queries";
import { deleteToken, insertToken } from "~shared/queries/tokens.queries";
import { createUserRole } from "~shared/queries/user-roles.queries";
import { createUser, signIn } from "~shared/queries/users.queries";
import { isAuthorizedSchema, LoginSchema, RegisterSchema } from "~shared/schemas/api/auth.schemas";

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
  .post("/register", validationMiddleware("json", RegisterSchema), async (c) => {
    const user = c.req.valid("json");
    const hashedPassword = await password.hash(user.password);

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
        ...getClientInfo(c),
      });

      const accessToken = await createAccessToken(insertedUser.id);
      setCookie(c, "accessToken", accessToken, getCookieSettings("access"));

      const refreshToken = await createRefreshToken(insertedUser.id, insertedToken.id);
      setCookie(c, "refreshToken", refreshToken, getCookieSettings("refresh"));

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
  .post("/login", validationMiddleware("json", LoginSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    try {
      const userId = await signIn(email, password);
      if (!userId) {
        return c.json({ success: false as const, error: "Invalid credentials" }, 200);
      }

      const insertedToken = await insertToken({
        userId,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_SECONDS * 1000).toISOString(),
        ...getClientInfo(c),
      });

      const accessToken = await createAccessToken(userId);
      setCookie(c, "accessToken", accessToken, getCookieSettings("access"));

      const refreshToken = await createRefreshToken(userId, insertedToken.id);
      setCookie(c, "refreshToken", refreshToken, getCookieSettings("refresh"));

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

    if (refreshToken) {
      try {
        const payload = await verifyToken(refreshToken, "refresh");
        if (payload?.jti) {
          await deleteToken(payload.jti);
        }
      } catch {
        return c.json({ success: false as const, error: "Failed to delete refresh token" }, 401);
      }
    }

    setCookie(c, "accessToken", "", getCookieSettings("clear"));
    setCookie(c, "refreshToken", "", getCookieSettings("clear"));

    return c.json({ success: true as const });
  })

  // --- All routes below this point require authentication
  .use(getSessionContext)

  /**
   * Get the authenticated user's session information
   *
   * @param c - The Hono context object with session context
   * @returns JSON response containing the authenticated user's session data
   * @access protected
   */
  .get("/", async (c) => {
    const sessionContext = c.var.sessionContext;
    return c.json({ success: true as const, ...sessionContext });
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
  });
