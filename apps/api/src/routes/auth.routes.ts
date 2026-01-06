import { password } from "bun";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";

import { getClientInfo } from "@/helpers/get-client-info";
import { createAccessToken, createRefreshToken, getCookieSettings, REFRESH_TOKEN_EXPIRATION_SECONDS, verifyToken } from "@/lib/jwt";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { isAuthorized } from "@bunstack/shared/auth";
import { deleteToken, insertToken } from "@bunstack/shared/queries/tokens.queries";
import { createUser, signIn } from "@bunstack/shared/queries/users.queries";
import { isAuthorizedSchema, LoginSchema, RegisterSchema } from "~shared/schemas/api/auth.schemas";

export const authRoutes = new Hono()
  /**
   * Register a new user
   *
   * @param c - The context
   * @returns The access token
   */
  .post("/register", validationMiddleware("json", RegisterSchema), async (c) => {
    const user = c.req.valid("json");
    const hashedPassword = await password.hash(user.password);

    try {
      const insertedUser = await createUser({ ...user, password: hashedPassword });

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
   * @param c - The context
   * @returns The access token
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
      console.log(error);
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Logout a user by clearing the refresh token cookie
   *
   * @param c - The context
   * @returns Success
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
   * Get the authenticated user
   *
   * @param c - The context
   * @returns The authenticated user
   */
  .get("/", async (c) => {
    const sessionContext = c.var.sessionContext;
    return c.json({ success: true as const, ...sessionContext });
  })

  /**
   *
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
