import type { NormalizedProfile } from "@/lib/oauth/providers";
import type { OAuthProviderId } from "~shared/types/db/oauth-accounts.types";

import { password } from "bun";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";

import { getClientInfo } from "@/helpers/get-client-info";
import { issueSession } from "@/helpers/issue-session";
import { getCookieSettings } from "@/lib/jwt";
import { generateCodeVerifier, generateState, getConfiguredProvider, getProvidersPayload, OAuthProfileError } from "@/lib/oauth/providers";
import { getSessionContext } from "@/middlewares/auth";
import { rateLimiter, rateLimitPresets } from "@/middlewares/rate-limit";
import { validationMiddleware } from "@/middlewares/validation";
import { appRedirect, createProviderUser, isRegistrationAllowed, peekSessionUserId, resolveProviderIdentity, sanitizeRedirect } from "@/services/provider-identity";
import { logLogin, logOAuthLink, logOAuthUnlink } from "~shared/queries/logs.queries";
import { countOAuthAccountsByUserId, createOAuthAccount, deleteOAuthAccount, getOAuthAccountByProvider, getOAuthAccountsByUserId } from "~shared/queries/oauth-accounts.queries";
import { getValidOAuthLinkToken, markOAuthLinkTokenUsed } from "~shared/queries/oauth-link-tokens.queries";
import { getValidOAuthSignupToken, markOAuthSignupTokenUsed } from "~shared/queries/oauth-signup-tokens.queries";
import { getUser, getUserByEmail } from "~shared/queries/users.queries";
import { AnyProviderParamSchema, CompletePendingLinkSchema, CompletePendingSignupSchema, OAuthProfileSchema, OAuthProviderIdSchema, OAuthProviderParamSchema, OAuthStartQuerySchema, PendingLinkQuerySchema, PendingSignupQuerySchema } from "~shared/schemas/api/oauth.schemas";

const OAUTH_FLOW_COOKIE = "oauthFlow";

type OAuthFlow = {
  provider: OAuthProviderId;
  state: string;
  codeVerifier?: string;
  mode: "login" | "link" | "confirm-link";
  redirectTo: string;
  linkToken?: string;
};

/** Mask an email for display during the link challenge (g•••@example.com). */
function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 1)}•••@${domain}`;
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
    const { providers, autoLogin } = await getProvidersPayload();
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
   * Describe a pending signup so the frontend can ask for the missing fields
   *
   * Like the pending-link token, a valid token is itself proof the caller just
   * completed the OAuth dance — it is handed to no one else.
   *
   * @param c - The Hono context object
   * @returns JSON response with the provider, the email the provider vouched
   * for, and whichever name parts it did supply
   * @throws {400} If the token is missing, used, or expired
   * @access public
   */
  .get("/pending-signup", validationMiddleware("query", PendingSignupQuerySchema), async (c) => {
    const { token } = c.req.valid("query");

    const pending = await getValidOAuthSignupToken(token);

    if (!pending) {
      return c.json({ success: false as const, error: "invalid_token" }, 400);
    }

    const profile = OAuthProfileSchema.parse(pending.profile);

    return c.json({
      success: true as const,
      pendingSignup: {
        provider: pending.provider,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
      },
    });
  })

  /**
   * Complete an OAuth signup with the fields the provider did not supply
   *
   * Creates the account and opens a session. No password is set: the provider
   * stays the sign-in method.
   *
   * @param c - The Hono context object
   * @returns JSON response indicating success; session cookies are set on success
   * @throws {400} If the token is invalid, registration is closed, or the
   * identity was claimed while the form was open
   * @access public
   */
  .post("/pending-signup/complete", rateLimiter(rateLimitPresets.register), validationMiddleware("json", CompletePendingSignupSchema), async (c) => {
    const { token, firstName, lastName } = c.req.valid("json");
    const clientInfo = getClientInfo(c);

    const pending = await getValidOAuthSignupToken(token);
    if (!pending) {
      return c.json({ success: false as const, error: "invalid_token" }, 400);
    }

    const provider = OAuthProviderIdSchema.parse(pending.provider);
    const profile = OAuthProfileSchema.parse(pending.profile);

    // The policy may have been tightened while the form sat open.
    if (!(await isRegistrationAllowed(provider))) {
      return c.json({ success: false as const, error: "registration_disabled" }, 400);
    }

    // …and the email or the provider identity may have been claimed since.
    // Signing in again lands on the link challenge, which is the right place
    // for an address that now belongs to someone.
    const [existingUser, linkedAccount] = await Promise.all([
      getUserByEmail(profile.email),
      getOAuthAccountByProvider(provider, pending.providerAccountId),
    ]);

    if (existingUser || linkedAccount) {
      return c.json({ success: false as const, error: "account_exists" }, 400);
    }

    await markOAuthSignupTokenUsed(pending.id);

    await createProviderUser(c, {
      provider,
      providerAccountId: pending.providerAccountId,
      email: profile.email,
      emailVerified: profile.emailVerified,
      firstName,
      lastName,
      avatarUrl: profile.avatarUrl,
      clientInfo,
    });

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
  .delete("/accounts/:provider", getSessionContext, validationMiddleware("param", AnyProviderParamSchema), async (c) => {
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
      // Browser navigation, never JSON — e.g. a login page rendered before
      // the admin disabled the provider.
      return appRedirect(c, "/login?oauthError=oauth_failed");
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

    // SSO runs OIDC discovery here, which can fail on a wrong issuer URL or
    // an unreachable IdP — surface it as a login error instead of a 500.
    let url: URL;
    try {
      url = await configured.def.createAuthorizationURL(configured.clientId, configured.clientSecret, state, codeVerifier ?? null);
    } catch {
      return appRedirect(c, "/login?oauthError=oauth_failed");
    }

    const flow: OAuthFlow = {
      provider,
      state,
      codeVerifier,
      mode,
      redirectTo: sanitizeRedirect(redirect),
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

    return resolveProviderIdentity(c, {
      provider,
      profile,
      mode: flow.mode,
      redirectTo,
      linkToken: flow.linkToken,
      clientInfo,
    });
  });
