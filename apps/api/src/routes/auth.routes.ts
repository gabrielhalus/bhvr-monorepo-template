import { password } from "bun";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { randomBytes } from "node:crypto";
import { ENV } from "varlock/env";

import { getClientInfo } from "@/helpers/get-client-info";
import { issueSession } from "@/helpers/issue-session";
import { wrapEmailHtml } from "@/lib/email-template";
import { fetchImageFromUrl, ImageFetchError } from "@/lib/fetch-image-url";
import { createAccessToken, getCookieSettings, verifyToken } from "@/lib/jwt";
import { contentTypeFromKey, deleteObject, getObject, imageExtFromContentType, objectKeys, uploadImage } from "@/lib/s3/storage";
import { getSessionContext } from "@/middlewares/auth";
import { rateLimiter, rateLimitPresets } from "@/middlewares/rate-limit";
import { validationMiddleware } from "@/middlewares/validation";
import { isEmailProviderConfigured, sendEmail } from "@/services/email";
import { provisionUser } from "@/services/user-provisioning";
import { isAuthorized, isAuthorizedBatch } from "~shared/auth";
import { getConfig } from "~shared/queries/configs.queries";
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
} from "~shared/queries/logs.queries";
import { createPasswordResetToken, getValidPasswordResetToken, markPasswordResetTokenUsed } from "~shared/queries/password-reset-tokens.queries";
import { deleteToken, getActiveTokensByUserId, revokeAllTokensByUserId, revokeAllTokensByUserIdExcept, revokeToken } from "~shared/queries/tokens.queries";
import { clearMustChangePassword, countUsers, getUser, getUserByEmail, signIn, updateUser, updateUserPassword } from "~shared/queries/users.queries";
import { ChangePasswordSchema, ForgotPasswordSchema, isAuthorizedSchema, LoginSchema, RegisterSchema, ResetPasswordSchema, UpdateAccountSchema, UpdatePreferencesSchema } from "~shared/schemas/api/auth.schemas";
import { UserPreferencesSchema } from "~shared/schemas/db/users.schemas";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const PASSWORD_RESET_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

export const authRoutes = new Hono()
  /**
   * Report whether the instance still needs its initial setup
   *
   * When no user exists yet, the app serves the registration screen so the
   * first account can bootstrap the instance as the system administrator.
   *
   * @param c - The Hono context object
   * @returns JSON response with a `needsSetup` flag
   * @access public
   */
  .get("/setup", async (c) => {
    const needsSetup = (await countUsers()) === 0;
    return c.json({ success: true as const, needsSetup });
  })

  /**
   * Register a new user
   *
   * The very first account to register bootstraps the instance: it receives the
   * `admin` role and is flagged as a system user (`metadata.system`). Every
   * subsequent registration receives the default role.
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
      const insertedUser = await provisionUser({ ...user, password: hashedPassword });

      await issueSession(c, insertedUser.id);

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
      await issueSession(c, userId);

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

  /**
   * Request a password reset link
   *
   * Always responds with success to avoid leaking which emails are registered.
   * When a mail provider is configured the reset link is emailed; otherwise the
   * message and link are logged server-side so the operator can relay them.
   *
   * @param c - The Hono context object
   * @returns JSON response always indicating success
   * @access public
   */
  .post("/forgot-password", rateLimiter(rateLimitPresets.forgotPassword), validationMiddleware("json", ForgotPasswordSchema), async (c) => {
    const { email } = c.req.valid("json");

    const user = await getUserByEmail(email);

    if (user) {
      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRATION_MS);
      await createPasswordResetToken(user.id, token, expiresAt);

      const resetUrl = `${ENV.APP_URL.replace(/\/$/, "")}/reset-password?token=${token}`;

      const businessName = (await getConfig("branding.appName"))?.value ?? undefined;
      const subject = "Réinitialisation de votre mot de passe";
      const text = `Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour en choisir un nouveau :\n\n${resetUrl}\n\nCe lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.`;

      if (await isEmailProviderConfigured()) {
        const result = await sendEmail({ to: user.email, subject, text, html: wrapEmailHtml(text, businessName) });
        if (result.error) {
          console.error(`[Password reset] Failed to send email to ${user.email}: ${result.error}`);
          console.warn(`[Password reset] Reset link for ${user.email}: ${resetUrl}`);
        }
      } else {
        console.warn(`[Password reset] No mail provider configured. Reset link for ${user.email}: ${resetUrl}`);
      }
    }

    return c.json({ success: true as const });
  })

  /**
   * Validate a password reset token
   *
   * @param c - The Hono context object
   * @returns JSON response with a `valid` flag
   * @access public
   */
  .get("/reset-password/validate", validationMiddleware("query", ResetPasswordSchema.pick({ token: true })), async (c) => {
    const { token } = c.req.valid("query");
    const record = await getValidPasswordResetToken(token);
    return c.json({ success: true as const, valid: Boolean(record) });
  })

  /**
   * Reset a password using a valid reset token
   *
   * Consumes the token, updates the password and revokes all existing sessions.
   *
   * @param c - The Hono context object
   * @returns JSON response indicating success or failure
   * @throws {400} If the token is invalid, expired, or already used
   * @access public
   */
  .post("/reset-password", rateLimiter(rateLimitPresets.resetPassword), validationMiddleware("json", ResetPasswordSchema), async (c) => {
    const { token, password: newPassword } = c.req.valid("json");
    const clientInfo = getClientInfo(c);

    const record = await getValidPasswordResetToken(token);
    if (!record) {
      return c.json({ success: false as const, error: "Invalid or expired token" }, 400);
    }

    const hashedPassword = await password.hash(newPassword);
    await updateUserPassword(record.userId, hashedPassword);
    await clearMustChangePassword(record.userId);
    await markPasswordResetTokenUsed(record.id);

    // Revoke every existing session — the reset invalidates prior credentials.
    await revokeAllTokensByUserId(record.userId);

    await logAccountPasswordChange({ actorId: record.userId, ...clientInfo });

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
    await clearMustChangePassword(sessionContext.user.id);

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
   * Upload (or replace) the authenticated user's profile photo.
   *
   * Accepts a multipart `file` field, stores it in object storage and persists
   * the object key on the user. The previous avatar object is best-effort deleted.
   *
   * @param c - The Hono context object with the multipart body
   * @returns JSON response with the updated user
   * @throws {400} If no file, a non-image type, or a file over the size limit
   * @access protected
   */
  .post("/avatar", async (c) => {
    const { user } = c.var.sessionContext;

    let bytes: Uint8Array;
    let contentType: string;
    let ext: string;

    const ct = c.req.header("content-type") ?? "";
    if (ct.includes("application/json")) {
      const body = await c.req.json() as Record<string, unknown>;
      const url = typeof body.url === "string" ? body.url : null;
      if (!url) {
        return c.json({ success: false as const, error: "Champ url manquant" }, 400);
      }
      try {
        ({ bytes, contentType, ext } = await fetchImageFromUrl(url, { maxBytes: MAX_AVATAR_BYTES }));
      } catch (err) {
        return c.json({ success: false as const, error: err instanceof ImageFetchError ? err.message : "Échec du téléchargement" }, 400);
      }
    } else {
      const body = await c.req.parseBody();
      const file = body.file;
      if (!(file instanceof File)) {
        return c.json({ success: false as const, error: "No file provided" }, 400);
      }
      const fileExt = imageExtFromContentType(file.type);
      if (!fileExt) {
        return c.json({ success: false as const, error: "Unsupported image type" }, 400);
      }
      if (file.size > MAX_AVATAR_BYTES) {
        return c.json({ success: false as const, error: "Image too large" }, 400);
      }
      ext = fileExt;
      contentType = file.type;
      bytes = new Uint8Array(await file.arrayBuffer());
    }

    const key = objectKeys.userAvatar(user.id, ext);
    await uploadImage(key, bytes, contentType);

    // Best-effort cleanup of a previous avatar stored under a different extension.
    if (user.avatar && user.avatar !== key) {
      try {
        await deleteObject(user.avatar);
      } catch {
        // ignore — orphaned object, not worth failing the upload
      }
    }

    const updated = await updateUser(user.id, { avatar: key });
    return c.json({ success: true as const, user: updated });
  })

  /**
   * Stream the authenticated user's profile photo from object storage.
   *
   * @param c - The Hono context object with session context
   * @returns The raw image bytes with its content type
   * @throws {404} If the user has no avatar
   * @access protected
   */
  .get("/avatar", async (c) => {
    const { user } = c.var.sessionContext;
    if (!user.avatar) {
      return c.json({ success: false as const, error: "Not Found" }, 404);
    }

    const { bytes, contentType } = await getObject(user.avatar);

    return c.newResponse(bytes, 200, {
      "Content-Type": contentType || contentTypeFromKey(user.avatar),
      "Cache-Control": "private, max-age=300",
    });
  })

  /**
   * Remove the authenticated user's profile photo.
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the updated user
   * @access protected
   */
  .delete("/avatar", async (c) => {
    const { user } = c.var.sessionContext;
    if (user.avatar) {
      try {
        await deleteObject(user.avatar);
      } catch {
        // ignore — storage may be unconfigured or object already gone
      }
    }

    const updated = await updateUser(user.id, { avatar: null });
    return c.json({ success: true as const, user: updated });
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
  .post("/impersonate/:id{[a-zA-Z0-9_-]{21}}", async (c) => {
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
