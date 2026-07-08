import type { NormalizedProfile } from "@/lib/oauth/providers";
import type { AppContext } from "@/utils/hono";
import type { OAuthProviderId } from "~shared/types/db/oauth-accounts.types";
import type { OrgId } from "~shared/types/org.types";
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
import { generateCodeVerifier, generateState, getConfiguredProvider, getProvidersPayload, OAuthProfileError } from "@/lib/oauth/providers";
import { objectKeys, uploadImage } from "@/lib/s3/storage";
import { getSessionContext } from "@/middlewares/auth";
import { classifyHostname } from "@/middlewares/org-context";
import { rateLimiter, rateLimitPresets } from "@/middlewares/rate-limit";
import { validationMiddleware } from "@/middlewares/validation";
import { provisionUser } from "@/services/user-provisioning";
import { getOrgContext, requireOrg } from "@/utils/hono";
import { isFeatureEnabled } from "~shared/queries/feature-flags.queries";
import { logLogin, logOAuthLink, logOAuthUnlink, logRegister } from "~shared/queries/logs.queries";
import { countOAuthAccountsByUserId, createOAuthAccount, deleteOAuthAccount, getOAuthAccountByProvider, getOAuthAccountsByUserId } from "~shared/queries/oauth-accounts.queries";
import { createOAuthLinkToken, getValidOAuthLinkToken, markOAuthLinkTokenUsed } from "~shared/queries/oauth-link-tokens.queries";
import { getOrganization } from "~shared/queries/organizations.queries";
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
  /** Validated origin (org domain or platform app) the flow returns to */
  returnOrigin: string;
  /** Organization the flow started on — decides where signups are provisioned */
  organizationId: string | null;
  linkToken?: string;
};

/**
 * Accept only same-origin absolute paths so provider callbacks can never be
 * turned into an open redirect.
 */
function sanitizeRedirect(raw: string | undefined): string {
  return raw && /^\/(?!\/)/.test(raw) ? raw : "/";
}

/** Redirect to a path on the given (already validated) frontend origin. */
function appRedirect(c: Context, path: string, origin: string = ENV.APP_URL) {
  return c.redirect(`${origin}${path}`);
}

/**
 * Determine where the flow should return to, and under which organization.
 * The candidate origin (Origin, else Referer, else the resolved org context)
 * is only trusted when its hostname classifies as a known org domain or the
 * platform surface — anything else falls back to APP_URL, so a provider
 * callback can never be turned into an open redirect onto a foreign host.
 */
async function resolveReturnContext(c: Context): Promise<{ returnOrigin: string; organizationId: string | null }> {
  const orgContext = getOrgContext(c);
  const fallback = { returnOrigin: ENV.APP_URL, organizationId: orgContext?.org.id ?? null };

  const candidate = c.req.header("origin") ?? (() => {
    const referer = c.req.header("referer");
    try {
      return referer ? new URL(referer).origin : null;
    } catch {
      return null;
    }
  })();

  if (!candidate) {
    return orgContext
      ? { returnOrigin: originForDomain(c, orgContext.domain), organizationId: orgContext.org.id }
      : fallback;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return fallback;
  }

  const classified = await classifyHostname(url.hostname.toLowerCase());
  if (classified === "platform") {
    return { returnOrigin: url.origin, organizationId: orgContext?.org.id ?? null };
  }
  if (classified) {
    return { returnOrigin: url.origin, organizationId: classified.id };
  }

  return fallback;
}

/** Rebuild a browser origin for a resolved org domain, keeping the app's scheme/port. */
function originForDomain(c: Context, domain: string): string {
  try {
    const appUrl = new URL(ENV.APP_URL);
    const port = appUrl.port ? `:${appUrl.port}` : "";
    return `${appUrl.protocol}//${domain}${port}`;
  } catch {
    return ENV.APP_URL;
  }
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
   * @returns JSON response with the providers usable for sign-in (id and
   * display label) and the SSO auto-login flag
   * @access public
   */
  .get("/providers", async (c) => {
    const orgContext = getOrgContext(c);
    const { providers, autoLogin } = await getProvidersPayload((orgContext?.org.id ?? null) as OrgId | null);
    return c.json({ success: true as const, providers, autoLogin });
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

    const { returnOrigin, organizationId } = await resolveReturnContext(c);

    const configured = await getConfiguredProvider(provider, (organizationId ?? null) as OrgId | null);
    if (!configured) {
      // Browser navigation, never JSON — e.g. a login page rendered before
      // the admin disabled the provider.
      return appRedirect(c, "/login?oauthError=oauth_failed", returnOrigin);
    }

    let mode: OAuthFlow["mode"] = "login";
    if (linkToken) {
      const pending = await getValidOAuthLinkToken(linkToken);
      if (!pending) {
        return appRedirect(c, "/login?oauthError=invalid_token", returnOrigin);
      }
      mode = "confirm-link";
    } else if (await peekSessionUserId(c)) {
      mode = "link";
    }

    const state = generateState();
    const codeVerifier = configured.def.usesPKCE ? generateCodeVerifier() : undefined;

    // SSO runs OIDC discovery here, which can fail on a wrong issuer URL or
    // an unreachable IdP — surface it as a login error instead of a 500.
    let url: URL;
    try {
      url = await configured.def.createAuthorizationURL(configured.clientId, configured.clientSecret, state, codeVerifier ?? null);
    } catch {
      return appRedirect(c, "/login?oauthError=oauth_failed", returnOrigin);
    }

    const flow: OAuthFlow = {
      provider,
      state,
      codeVerifier,
      mode,
      redirectTo: sanitizeRedirect(redirect),
      returnOrigin,
      organizationId,
      linkToken,
    };
    setCookie(c, OAUTH_FLOW_COOKIE, JSON.stringify(flow), getCookieSettings("oauth"));

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

    // Re-validate the stored return origin — the cookie could predate a
    // domain removal or a code change.
    const returnTo = await (async () => {
      try {
        const url = new URL(flow.returnOrigin);
        if (await classifyHostname(url.hostname.toLowerCase())) {
          return url.origin;
        }
      } catch {
        // Malformed origin — fall back below
      }
      return ENV.APP_URL;
    })();

    // Restore the organization the flow started on: the callback lands on the
    // API origin, so the domain-based context can't know it.
    if (flow.organizationId) {
      const flowOrg = await getOrganization(flow.organizationId);
      if (!flowOrg) {
        return appRedirect(c, "/login?oauthError=oauth_failed", returnTo);
      }
      (c as unknown as AppContext).set("orgContext", { org: flowOrg, domain: new URL(returnTo).hostname });
    }

    const configured = await getConfiguredProvider(provider, (flow.organizationId ?? null) as OrgId | null);
    if (!configured) {
      return appRedirect(c, "/login?oauthError=oauth_failed", returnTo);
    }

    // Re-validate: the cookie could predate a code change.
    const redirectTo = sanitizeRedirect(flow.redirectTo);

    let profile: NormalizedProfile;
    try {
      const tokens = await configured.def.validateCode(configured.clientId, configured.clientSecret, code, flow.codeVerifier ?? null);
      profile = await configured.def.fetchProfile(tokens);
    } catch (error) {
      const errorCode = error instanceof OAuthProfileError ? error.code : "oauth_failed";
      return appRedirect(c, `/login?oauthError=${errorCode}`, returnTo);
    }

    const linkedAccount = await getOAuthAccountByProvider(provider, profile.providerAccountId);

    // ── Link mode: a live session initiated the flow from the settings page ──
    if (flow.mode === "link") {
      const sessionUserId = await peekSessionUserId(c);

      if (sessionUserId) {
        if (linkedAccount) {
          return linkedAccount.userId === sessionUserId
            ? appRedirect(c, "/account?linked=already", returnTo)
            : appRedirect(c, "/account?oauthError=account_taken", returnTo);
        }

        const existing = await getOAuthAccountsByUserId(sessionUserId);
        if (existing.some(account => account.provider === provider)) {
          return appRedirect(c, "/account?oauthError=provider_already_linked", returnTo);
        }

        await createOAuthAccount({ userId: sessionUserId, provider, providerAccountId: profile.providerAccountId, email: profile.email });
        await logOAuthLink(sessionUserId, provider, clientInfo);

        return appRedirect(c, `/account?linked=${provider}`, returnTo);
      }
      // Session expired mid-flow — fall through to login handling.
    }

    // ── Confirm-link mode: re-auth with an already linked provider ──────────
    if (flow.mode === "confirm-link" && flow.linkToken) {
      const pending = await getValidOAuthLinkToken(flow.linkToken);
      if (!pending) {
        return appRedirect(c, "/login?oauthError=invalid_token", returnTo);
      }

      // The just-authenticated provider identity must already belong to the
      // target account — that is the proof of ownership.
      if (!linkedAccount || linkedAccount.userId !== pending.userId) {
        return appRedirect(c, `/link-account?token=${pending.token}&error=confirm_failed`, returnTo);
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

      return appRedirect(c, redirectTo, returnTo);
    }

    // ── Login mode ───────────────────────────────────────────────────────────

    // Flow B: known provider identity → straight sign-in.
    if (linkedAccount) {
      await issueSession(c, linkedAccount.userId);
      await logLogin(linkedAccount.userId, clientInfo);

      return appRedirect(c, redirectTo, returnTo);
    }

    const existingUser = await getUserByEmail(profile.email);

    // Flow C: the email belongs to an existing account → challenge, no session.
    if (existingUser) {
      if (!profile.emailVerified) {
        return appRedirect(c, "/login?oauthError=email_unverified", returnTo);
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

      return appRedirect(c, `/link-account?token=${token}`, returnTo);
    }

    // Flow A: unknown email → OAuth signup, honoring the registration policy.
    // SSO bypasses it: the IdP is the source of truth for who may sign in.
    const isFirstUser = (await countUsers()) === 0;
    const registrationEnabled = await isFeatureEnabled("registration", (flow.organizationId ?? null) as OrgId | null);

    if (provider !== "sso" && !registrationEnabled && !isFirstUser) {
      return appRedirect(c, "/login?oauthError=registration_disabled", returnTo);
    }

    const insertedUser = await provisionUser(requireOrg(c), {
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

    return appRedirect(c, redirectTo, returnTo);
  });
