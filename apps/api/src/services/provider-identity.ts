import type { getClientInfo } from "@/helpers/get-client-info";
import type { NormalizedProfile } from "@/lib/oauth/providers";
import type { OAuthProviderId } from "~shared/types/db/oauth-accounts.types";
import type { Context } from "hono";

import { getCookie } from "hono/cookie";
import { randomBytes } from "node:crypto";
import { ENV } from "varlock/env";

import { issueSession } from "@/helpers/issue-session";
import { fetchImageFromUrl } from "@/lib/fetch-image-url";
import { verifyToken } from "@/lib/jwt";
import { objectKeys, uploadImage } from "@/lib/s3/storage";
import { provisionUser } from "@/services/user-provisioning";
import { getConfig } from "~shared/queries/configs.queries";
import { logLogin, logOAuthLink, logRegister } from "~shared/queries/logs.queries";
import { createOAuthAccount, getOAuthAccountByProvider, getOAuthAccountsByUserId } from "~shared/queries/oauth-accounts.queries";
import { createOAuthLinkToken, getValidOAuthLinkToken, markOAuthLinkTokenUsed } from "~shared/queries/oauth-link-tokens.queries";
import { createOAuthSignupToken } from "~shared/queries/oauth-signup-tokens.queries";
import { getToken } from "~shared/queries/tokens.queries";
import { countUsers, getUserByEmail, updateUser } from "~shared/queries/users.queries";
import { OAuthProfileSchema } from "~shared/schemas/api/oauth.schemas";

export const PENDING_LINK_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
export const PENDING_SIGNUP_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/**
 * How a provider callback should be interpreted.
 *
 * `link` — a live session initiated the flow from the settings page.
 * `confirm-link` — re-authenticating with an already linked provider to prove
 * ownership of a pending link.
 * `login` — everything else.
 */
export type ProviderFlowMode = "login" | "link" | "confirm-link";

/**
 * Accept only same-origin absolute paths so provider callbacks can never be
 * turned into an open redirect.
 */
export function sanitizeRedirect(raw: string | undefined): string {
  return raw && /^\/(?!\/)/.test(raw) ? raw : "/";
}

/** Redirect to a path on the frontend origin. */
export function appRedirect(c: Context, path: string) {
  return c.redirect(`${ENV.APP_URL}${path}`);
}

/**
 * Check for a live session without rejecting the request: the refresh token
 * record is the session source of truth.
 */
export async function peekSessionUserId(c: Context): Promise<string | null> {
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
 * Whether an unknown provider identity may open an account.
 *
 * SSO bypasses the registration policy: the identity provider is the source of
 * truth for who may sign in. The very first account always goes through — it
 * bootstraps the instance.
 */
export async function isRegistrationAllowed(provider: OAuthProviderId): Promise<boolean> {
  if (provider === "sso") {
    return true;
  }

  const isFirstUser = (await countUsers()) === 0;
  const registerConfig = await getConfig("authentication.register.enable");

  return registerConfig?.value === "true" || isFirstUser;
}

/**
 * Provision an account from a provider identity, link it, and open a session.
 *
 * Shared by the two ways a signup can end: straight through when the provider
 * supplied everything, or after the visitor completed what it did not. No
 * password is ever set — the provider is the sign-in method.
 */
export async function createProviderUser(c: Context, data: {
  provider: OAuthProviderId;
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  clientInfo: ReturnType<typeof getClientInfo>;
}) {
  const insertedUser = await provisionUser({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    ...(data.emailVerified && { verifiedAt: new Date().toISOString() }),
  });

  await createOAuthAccount({
    userId: insertedUser.id,
    provider: data.provider,
    providerAccountId: data.providerAccountId,
    email: data.email,
  });

  if (data.avatarUrl) {
    await importAvatar(insertedUser.id, data.avatarUrl);
  }

  await issueSession(c, insertedUser.id);

  await logRegister(insertedUser.id, data.clientInfo);
  await logOAuthLink(insertedUser.id, data.provider, data.clientInfo);

  return insertedUser;
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

/**
 * Turn an authenticated provider identity into a session, a pending link or a
 * pending signup, and redirect accordingly.
 *
 * This is the half of the flow that does not depend on the protocol used to
 * obtain the profile: OAuth/OIDC hands it a profile decoded from an id_token,
 * SAML hands it one extracted from a signed assertion, and from here on the
 * two are treated identically.
 *
 * @param c - The Hono context object
 * @param params - The authenticated identity and the flow it belongs to
 * @param params.provider - The provider that vouched for the identity
 * @param params.profile - The normalized profile it returned
 * @param params.mode - How the callback should be interpreted
 * @param params.redirectTo - Where to land once the session is open
 * @param params.linkToken - The pending link being confirmed, in confirm-link mode
 * @param params.clientInfo - The caller's user agent and IP, for the audit log
 * @returns A redirect to the frontend — browser navigation, never JSON
 */
export async function resolveProviderIdentity(c: Context, params: {
  provider: OAuthProviderId;
  profile: NormalizedProfile;
  mode: ProviderFlowMode;
  redirectTo: string;
  linkToken?: string;
  clientInfo: ReturnType<typeof getClientInfo>;
}): Promise<Response> {
  const { provider, profile, mode, linkToken, clientInfo } = params;
  const redirectTo = sanitizeRedirect(params.redirectTo);

  const linkedAccount = await getOAuthAccountByProvider(provider, profile.providerAccountId);

  // ── Link mode: a live session initiated the flow from the settings page ──
  if (mode === "link") {
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
  if (mode === "confirm-link" && linkToken) {
    const pending = await getValidOAuthLinkToken(linkToken);
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

  // Flow A: unknown email → provider signup, honoring the registration policy.
  // Enterprise IdPs bypass it: they are the source of truth for who may sign in.
  if (!(await isRegistrationAllowed(provider))) {
    return appRedirect(c, "/login?oauthError=registration_disabled");
  }

  // Flow A′: the provider gave no usable name → hold the signup open and ask
  // the visitor. Nothing is written to `users` until they answer, so an
  // abandoned signup expires without leaving a half-built account behind.
  if (!profile.firstName || !profile.lastName) {
    const token = randomBytes(32).toString("base64url");
    await createOAuthSignupToken({
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
      expiresAt: new Date(Date.now() + PENDING_SIGNUP_EXPIRATION_MS),
    });

    return appRedirect(c, `/complete-signup?token=${token}&redirect=${encodeURIComponent(redirectTo)}`);
  }

  await createProviderUser(c, {
    provider,
    providerAccountId: profile.providerAccountId,
    email: profile.email,
    emailVerified: profile.emailVerified,
    firstName: profile.firstName,
    lastName: profile.lastName,
    avatarUrl: profile.avatarUrl,
    clientInfo,
  });

  return appRedirect(c, redirectTo);
}
