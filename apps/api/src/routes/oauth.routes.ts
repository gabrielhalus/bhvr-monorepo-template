import type { NormalizedProfile } from "@/lib/oauth/providers";
import type { OAuthProviderId } from "~shared/types/db/oauth-accounts.types";
import type { Context } from "hono";

import { password } from "bun";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { randomBytes } from "node:crypto";
import { ENV } from "varlock/env";

import { getClientInfo } from "@/helpers/get-client-info";
import { issueSession } from "@/helpers/issue-session";
import { fetchImageFromUrl } from "@/lib/fetch-image-url";
import { getCookieSettings, verifyToken } from "@/lib/jwt";
import { generateCodeVerifier, generateState, getConfiguredProvider, getEnabledProviders, OAuthProfileError } from "@/lib/oauth/providers";
import { objectKeys, uploadImage } from "@/lib/s3/storage";
import { getSessionContext } from "@/middlewares/auth";
import { rateLimiter, rateLimitPresets } from "@/middlewares/rate-limit";
import { validationMiddleware } from "@/middlewares/validation";
import { provisionUser } from "@/services/user-provisioning";
import { getConfig } from "~shared/queries/configs.queries";
import { logLogin, logOAuthLink, logOAuthUnlink, logRegister } from "~shared/queries/logs.queries";
import { countOAuthAccountsByUserId, createOAuthAccount, deleteOAuthAccount, getOAuthAccountByProvider, getOAuthAccountsByUserId } from "~shared/queries/oauth-accounts.queries";
import { createOAuthLinkToken, getValidOAuthLinkToken, markOAuthLinkTokenUsed } from "~shared/queries/oauth-link-tokens.queries";
import { getToken } from "~shared/queries/tokens.queries";
import { countUsers, getUser, getUserByEmail, updateUser } from "~shared/queries/users.queries";
import { CompletePendingLinkSchema, OAuthProfileSchema, OAuthProviderParamSchema, OAuthStartQuerySchema, PendingLinkQuerySchema } from "~shared/schemas/api/oauth.schemas";

const OAUTH_FLOW_COOKIE = "oauthFlow";
const PENDING_LINK_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

type OAuthFlow = {
  provider: OAuthProviderId;
  state: string;
  codeVerifier?: string;
  mode: "login" | "link" | "confirm-link";
  redirectTo: string;
  linkToken?: string;
};

/**
 * Accept only same-origin absolute paths so provider callbacks can never be
 * turned into an open redirect.
 */
function sanitizeRedirect(raw: string | undefined): string {
  return raw && /^\/(?!\/)/.test(raw) ? raw : "/";
}

/** Redirect to a path on the frontend origin. */
function appRedirect(c: Context, path: string) {
  return c.redirect(`${ENV.APP_URL}${path}`);
}

/** Mask an email for display during the link challenge (g•••@example.com). */
function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 1)}•••@${domain}`;
}

/**
 * Check for a live session without rejecting the request: the refresh token
 * record is the session source of truth.
 */
async function peekSessionUserId(c: Context): Promise<string | null> {
  const refreshToken = getCookie(c, "refreshToken");
  if (!refreshToken) {
    return null;
  }

  try {
    const payload = await verifyToken(refreshToken, "refresh");
    if (!payload?.jti) {
      return null;
    }

    const tokenRecord = await getToken(payload.jti);
    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date().toISOString()) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}

/**
 * Best-effort import of the provider avatar for a freshly provisioned user.
 * Failures are swallowed — the account works fine without a picture.
 */
async function importAvatar(userId: string, avatarUrl: string) {
  try {
    const { bytes, contentType, ext } = await fetchImageFromUrl(avatarUrl, { maxBytes: MAX_AVATAR_BYTES });
    const key = objectKeys.userAvatar(userId, ext);
    await uploadImage(key, bytes, contentType);
    await updateUser(userId, { avatar: key });
  } catch {
    // ignore — avatar import is cosmetic
  }
}

export const oauthRoutes = new Hono()
  /**
   * List the OAuth providers that are enabled and fully configured
   *
   * @param c - The Hono context object
   * @returns JSON response with the provider ids usable for sign-in
   * @access public
   */
  .get("/providers", async (c) => {
    const providers = await getEnabledProviders();
    return c.json({ success: true as const, providers });
  })

  /**
   * Describe a pending account link so the frontend can render the challenge
   *
   * The token is 32 random bytes handed only to the flow initiator, so a valid
   * token is itself proof the caller just completed the OAuth dance.
   *
   * @param c - The Hono context object
   * @returns JSON response with the provider, masked email and available challenge methods
   * @throws {400} If the token is missing, used, or expired
   * @access public
   */
  .get("/pending-link", validationMiddleware("query", PendingLinkQuerySchema), async (c) => {
    const { token } = c.req.valid("query");

    const pending = await getValidOAuthLinkToken(token);
    const user = pending ? await getUser(pending.userId) : null;

    if (!pending || !user) {
      return c.json({ success: false as const, error: "invalid_token" }, 400);
    }

    const accounts = await getOAuthAccountsByUserId(pending.userId);

    return c.json({
      success: true as const,
      pendingLink: {
        provider: pending.provider,
        email: maskEmail(user.email),
        hasPassword: user.password !== null,
        linkedProviders: accounts.map(account => account.provider),
      },
    });
  })

  /**
   * Complete a pending link with the password challenge
   *
   * Applies the same constant-time floor and rate limit as `/auth/login` since
   * this endpoint verifies a password.
   *
   * @param c - The Hono context object
   * @returns JSON response indicating success; session cookies are set on success
   * @throws {400} If the token is invalid or the account has no password
   * @access public
   */
  .post("/pending-link/complete", rateLimiter(rateLimitPresets.login), validationMiddleware("json", CompletePendingLinkSchema), async (c) => {
    const MIN_RESPONSE_TIME_MS = 500;
    const start = performance.now();

    const { token, password: plainPassword } = c.req.valid("json");
    const clientInfo = getClientInfo(c);

    let error: "invalid_token" | "invalid_credentials" | null = null;

    const pending = await getValidOAuthLinkToken(token);
    const user = pending ? await getUser(pending.userId) : null;

    if (!pending || !user || !user.password) {
      error = "invalid_token";
    } else if (!(await password.verify(plainPassword, user.password))) {
      error = "invalid_credentials";
    } else {
      const profile = OAuthProfileSchema.parse(pending.profile);

      await markOAuthLinkTokenUsed(pending.id);
      await createOAuthAccount({
        userId: user.id,
        provider: pending.provider,
        providerAccountId: pending.providerAccountId,
        email: profile.email,
      });

      await issueSession(c, user.id);

      await logOAuthLink(user.id, pending.provider, clientInfo);
      await logLogin(user.id, clientInfo);
    }

    // Constant-time floor
    const elapsed = performance.now() - start;
    const remaining = MIN_RESPONSE_TIME_MS - elapsed;
    if (remaining > 0) {
      await Bun.sleep(remaining);
    }

    if (error) {
      return c.json({ success: false as const, error }, 400);
    }

    return c.json({ success: true as const });
  })

  /**
   * List the OAuth accounts linked to the authenticated user
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the linked accounts and whether a password is set
   * @access protected
   */
  .get("/accounts", getSessionContext, async (c) => {
    const { user } = c.var.sessionContext;

    const accounts = await getOAuthAccountsByUserId(user.id);

    return c.json({
      success: true as const,
      accounts: accounts.map(({ provider, email, createdAt }) => ({ provider, email, createdAt })),
      hasPassword: user.password !== null,
    });
  })

  /**
   * Unlink an OAuth provider from the authenticated user
   *
   * Refused when it would remove the account's last sign-in method (no
   * password and no other linked provider).
   *
   * @param c - The Hono context object with session context
   * @returns JSON response indicating success
   * @throws {400} If the provider is the last sign-in method or is not linked
   * @access protected
   */
  .delete("/accounts/:provider", getSessionContext, validationMiddleware("param", OAuthProviderParamSchema), async (c) => {
    const { user } = c.var.sessionContext;
    const { provider } = c.req.valid("param");
    const clientInfo = getClientInfo(c);

    const linkedCount = await countOAuthAccountsByUserId(user.id);
    if (user.password === null && linkedCount <= 1) {
      return c.json({ success: false as const, error: "last_auth_method" }, 400);
    }

    const deleted = await deleteOAuthAccount(user.id, provider);
    if (!deleted) {
      return c.json({ success: false as const, error: "not_linked" }, 400);
    }

    await logOAuthUnlink(user.id, provider, clientInfo);

    return c.json({ success: true as const });
  })

  /**
   * Start the OAuth flow for a provider
   *
   * Detects the flow mode: `link` when a live session initiates it from the
   * settings page, `confirm-link` when re-authenticating with an already
   * linked provider to prove ownership of a pending link, `login` otherwise.
   *
   * @param c - The Hono context object
   * @returns 302 redirect to the provider's authorization URL
   * @throws {404} If the provider is disabled or not configured
   * @access public
   */
  .get("/:provider", rateLimiter(rateLimitPresets.oauthStart), validationMiddleware("param", OAuthProviderParamSchema), validationMiddleware("query", OAuthStartQuerySchema), async (c) => {
    const { provider } = c.req.valid("param");
    const { redirect, linkToken } = c.req.valid("query");

    const configured = await getConfiguredProvider(provider);
    if (!configured) {
      return c.json({ success: false as const, error: "Provider not available" }, 404);
    }

    let mode: OAuthFlow["mode"] = "login";
    if (linkToken) {
      const pending = await getValidOAuthLinkToken(linkToken);
      if (!pending) {
        return appRedirect(c, "/login?oauthError=invalid_token");
      }
      mode = "confirm-link";
    } else if (await peekSessionUserId(c)) {
      mode = "link";
    }

    const state = generateState();
    const codeVerifier = configured.def.usesPKCE ? generateCodeVerifier() : undefined;

    const flow: OAuthFlow = {
      provider,
      state,
      codeVerifier,
      mode,
      redirectTo: sanitizeRedirect(redirect),
      linkToken,
    };
    setCookie(c, OAUTH_FLOW_COOKIE, JSON.stringify(flow), getCookieSettings("oauth"));

    const url = configured.def.createAuthorizationURL(configured.clientId, configured.clientSecret, state, codeVerifier ?? null);
    return c.redirect(url.toString());
  })

  /**
   * Handle the provider callback and finish the flow
   *
   * Login mode: signs in a linked account, provisions a new account for an
   * unknown email (when registration is allowed), or creates a pending link
   * when the email matches an existing user — in that case no session is
   * issued until the challenge on `/link-account` is completed.
   *
   * @param c - The Hono context object
   * @returns 302 redirect to the frontend (browser navigation, never JSON)
   * @access public
   */
  .get("/:provider/callback", rateLimiter(rateLimitPresets.oauthStart), validationMiddleware("param", OAuthProviderParamSchema), async (c) => {
    const { provider } = c.req.valid("param");
    const clientInfo = getClientInfo(c);

    // Consume the flow cookie no matter how the callback ends.
    const rawFlow = getCookie(c, OAUTH_FLOW_COOKIE);
    setCookie(c, OAUTH_FLOW_COOKIE, "", getCookieSettings("clear"));

    let flow: OAuthFlow | null = null;
    try {
      flow = rawFlow ? JSON.parse(rawFlow) as OAuthFlow : null;
    } catch {
      flow = null;
    }

    const code = c.req.query("code");
    const state = c.req.query("state");

    if (!flow || flow.provider !== provider || !code || !state || state !== flow.state || c.req.query("error")) {
      return appRedirect(c, "/login?oauthError=oauth_failed");
    }

    const configured = await getConfiguredProvider(provider);
    if (!configured) {
      return appRedirect(c, "/login?oauthError=oauth_failed");
    }

    // Re-validate: the cookie could predate a code change.
    const redirectTo = sanitizeRedirect(flow.redirectTo);

    let profile: NormalizedProfile;
    try {
      const tokens = await configured.def.validateCode(configured.clientId, configured.clientSecret, code, flow.codeVerifier ?? null);
      profile = await configured.def.fetchProfile(tokens);
    } catch (error) {
      const errorCode = error instanceof OAuthProfileError ? error.code : "oauth_failed";
      return appRedirect(c, `/login?oauthError=${errorCode}`);
    }

    const linkedAccount = await getOAuthAccountByProvider(provider, profile.providerAccountId);

    // ── Link mode: a live session initiated the flow from the settings page ──
    if (flow.mode === "link") {
      const sessionUserId = await peekSessionUserId(c);

      if (sessionUserId) {
        if (linkedAccount) {
          return linkedAccount.userId === sessionUserId
            ? appRedirect(c, "/account?linked=already")
            : appRedirect(c, "/account?oauthError=account_taken");
        }

        const existing = await getOAuthAccountsByUserId(sessionUserId);
        if (existing.some(account => account.provider === provider)) {
          return appRedirect(c, "/account?oauthError=provider_already_linked");
        }

        await createOAuthAccount({ userId: sessionUserId, provider, providerAccountId: profile.providerAccountId, email: profile.email });
        await logOAuthLink(sessionUserId, provider, clientInfo);

        return appRedirect(c, `/account?linked=${provider}`);
      }
      // Session expired mid-flow — fall through to login handling.
    }

    // ── Confirm-link mode: re-auth with an already linked provider ──────────
    if (flow.mode === "confirm-link" && flow.linkToken) {
      const pending = await getValidOAuthLinkToken(flow.linkToken);
      if (!pending) {
        return appRedirect(c, "/login?oauthError=invalid_token");
      }

      // The just-authenticated provider identity must already belong to the
      // target account — that is the proof of ownership.
      if (!linkedAccount || linkedAccount.userId !== pending.userId) {
        return appRedirect(c, `/link-account?token=${pending.token}&error=confirm_failed`);
      }

      const pendingProfile = OAuthProfileSchema.parse(pending.profile);

      await markOAuthLinkTokenUsed(pending.id);
      await createOAuthAccount({
        userId: pending.userId,
        provider: pending.provider,
        providerAccountId: pending.providerAccountId,
        email: pendingProfile.email,
      });

      await issueSession(c, pending.userId);

      await logOAuthLink(pending.userId, pending.provider, clientInfo);
      await logLogin(pending.userId, clientInfo);

      return appRedirect(c, redirectTo);
    }

    // ── Login mode ───────────────────────────────────────────────────────────

    // Flow B: known provider identity → straight sign-in.
    if (linkedAccount) {
      await issueSession(c, linkedAccount.userId);
      await logLogin(linkedAccount.userId, clientInfo);

      return appRedirect(c, redirectTo);
    }

    const existingUser = await getUserByEmail(profile.email);

    // Flow C: the email belongs to an existing account → challenge, no session.
    if (existingUser) {
      if (!profile.emailVerified) {
        return appRedirect(c, "/login?oauthError=email_unverified");
      }

      const token = randomBytes(32).toString("base64url");
      await createOAuthLinkToken({
        userId: existingUser.id,
        provider,
        providerAccountId: profile.providerAccountId,
        token,
        profile: {
          email: profile.email,
          emailVerified: profile.emailVerified,
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatarUrl: profile.avatarUrl,
        },
        expiresAt: new Date(Date.now() + PENDING_LINK_EXPIRATION_MS),
      });

      return appRedirect(c, `/link-account?token=${token}`);
    }

    // Flow A: unknown email → OAuth signup, honoring the registration policy.
    const isFirstUser = (await countUsers()) === 0;
    const registerConfig = await getConfig("authentication.register.enable");

    if (registerConfig?.value !== "true" && !isFirstUser) {
      return appRedirect(c, "/login?oauthError=registration_disabled");
    }

    const insertedUser = await provisionUser({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      ...(profile.emailVerified && { verifiedAt: new Date().toISOString() }),
    });

    await createOAuthAccount({ userId: insertedUser.id, provider, providerAccountId: profile.providerAccountId, email: profile.email });

    if (profile.avatarUrl) {
      await importAvatar(insertedUser.id, profile.avatarUrl);
    }

    await issueSession(c, insertedUser.id);

    await logRegister(insertedUser.id, clientInfo);
    await logOAuthLink(insertedUser.id, provider, clientInfo);

    return appRedirect(c, redirectTo);
  });
