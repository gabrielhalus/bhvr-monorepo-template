import type { ProviderFlowMode } from "@/services/provider-identity";
import type { Profile } from "@node-saml/node-saml";

import { Hono } from "hono";

import { getClientInfo } from "@/helpers/get-client-info";
import { buildSamlClient, extractRequestId, getSamlSettings, normalizeSamlProfile, SamlProfileError } from "@/lib/saml/client";
import { rateLimiter, rateLimitPresets } from "@/middlewares/rate-limit";
import { validationMiddleware } from "@/middlewares/validation";
import { appRedirect, peekSessionUserId, resolveProviderIdentity, sanitizeRedirect } from "@/services/provider-identity";
import { getValidOAuthLinkToken } from "~shared/queries/oauth-link-tokens.queries";
import { consumeSamlFlow, createSamlFlow } from "~shared/queries/saml-flows.queries";
import { OAuthStartQuerySchema } from "~shared/schemas/api/oauth.schemas";

const SAML_FLOW_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Map a node-saml validation failure onto a login error code.
 *
 * The raw message is never surfaced: it quotes XML and certificate internals
 * that tell an attacker how validation was reached. It is logged instead.
 */
function samlErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("signature")) {
    return "saml_invalid_signature";
  }
  if (message.includes("expired") || message.includes("notonorafter") || message.includes("notbefore")) {
    return "saml_assertion_expired";
  }
  if (message.includes("audience")) {
    return "saml_audience_mismatch";
  }

  return "saml_failed";
}

export const samlRoutes = new Hono()
  /**
   * Serve the service provider metadata for registration with the IdP
   *
   * Public on purpose: SP metadata carries the entity id, the ACS endpoint and
   * the signing certificate, all of which are meant to be handed out.
   *
   * @param c - The Hono context object
   * @returns XML response with the SP metadata
   * @throws {404} If SAML is disabled or not configured
   * @access public
   */
  .get("/metadata", async (c) => {
    const settings = await getSamlSettings();
    if (!settings) {
      return c.json({ success: false as const, error: "saml_not_configured" }, 404);
    }

    const xml = buildSamlClient(settings).generateServiceProviderMetadata(null, settings.spCert ?? null);

    return c.body(xml, 200, { "Content-Type": "application/samlmetadata+xml" });
  })

  /**
   * Start the SAML flow
   *
   * Mirrors the OAuth start route's mode detection, but persists the flow in
   * `saml_flows` rather than a cookie: the IdP answers with a cross-site POST,
   * on which the browser withholds `SameSite=Lax` cookies.
   *
   * @param c - The Hono context object
   * @returns 302 redirect to the IdP's SSO endpoint
   * @access public
   */
  .get("/login", rateLimiter(rateLimitPresets.oauthStart), validationMiddleware("query", OAuthStartQuerySchema), async (c) => {
    const { redirect, linkToken } = c.req.valid("query");

    const settings = await getSamlSettings();
    if (!settings) {
      // Browser navigation, never JSON — e.g. a login page rendered before the
      // admin disabled the provider.
      return appRedirect(c, "/login?oauthError=saml_failed");
    }

    let mode: ProviderFlowMode = "login";
    if (linkToken) {
      const pending = await getValidOAuthLinkToken(linkToken);
      if (!pending) {
        return appRedirect(c, "/login?oauthError=invalid_token");
      }
      mode = "confirm-link";
    } else if (await peekSessionUserId(c)) {
      mode = "link";
    }

    let url: string;
    let requestId: string;
    try {
      url = await buildSamlClient(settings).getAuthorizeUrlAsync("", undefined, {});
      requestId = extractRequestId(url);
    } catch (error) {
      console.error("[SAML] failed to build the authentication request:", error);
      return appRedirect(c, "/login?oauthError=saml_failed");
    }

    await createSamlFlow({
      requestId,
      mode,
      redirectTo: sanitizeRedirect(redirect),
      linkToken,
      expiresAt: new Date(Date.now() + SAML_FLOW_EXPIRATION_MS),
    });

    return c.redirect(url);
  })

  /**
   * Assertion consumer service — handle the IdP's POST and finish the flow
   *
   * The assertion arrives as `application/x-www-form-urlencoded`, not JSON.
   *
   * @param c - The Hono context object
   * @returns 302 redirect to the frontend (browser navigation, never JSON)
   * @access public
   */
  .post("/callback", rateLimiter(rateLimitPresets.oauthStart), async (c) => {
    const clientInfo = getClientInfo(c);

    const settings = await getSamlSettings();
    if (!settings) {
      return appRedirect(c, "/login?oauthError=saml_failed");
    }

    const form = await c.req.formData().catch(() => null);
    const samlResponse = form?.get("SAMLResponse");
    if (typeof samlResponse !== "string") {
      return appRedirect(c, "/login?oauthError=saml_failed");
    }

    let profile: Profile | null;
    try {
      const saml = buildSamlClient(settings);
      ({ profile } = await saml.validatePostResponseAsync({ SAMLResponse: samlResponse }));
    } catch (error) {
      console.error("[SAML] assertion rejected:", error);
      return appRedirect(c, `/login?oauthError=${samlErrorCode(error)}`);
    }

    if (!profile) {
      return appRedirect(c, "/login?oauthError=saml_failed");
    }

    // The flow row is consumed atomically: a replayed assertion finds nothing
    // left to consume and stops here.
    const inResponseTo = typeof profile.inResponseTo === "string" ? profile.inResponseTo : null;
    if (!inResponseTo) {
      // No InResponseTo means an IdP-initiated assertion, which this flow does
      // not accept — there is no request of ours to match it against.
      return appRedirect(c, "/login?oauthError=saml_replay");
    }

    const flow = await consumeSamlFlow(inResponseTo);
    if (!flow) {
      return appRedirect(c, "/login?oauthError=saml_replay");
    }

    let normalized;
    try {
      normalized = normalizeSamlProfile(profile, settings);
    } catch (error) {
      const code = error instanceof SamlProfileError ? error.code : "saml_failed";
      return appRedirect(c, `/login?oauthError=${code}`);
    }

    return resolveProviderIdentity(c, {
      provider: "saml",
      profile: normalized,
      mode: flow.mode as ProviderFlowMode,
      redirectTo: flow.redirectTo,
      linkToken: flow.linkToken ?? undefined,
      clientInfo,
    });
  })

  /**
   * Reject a redirect-binding callback
   *
   * Some IdPs are configured to answer on HTTP-Redirect; the ACS only accepts
   * HTTP-POST, and saying so beats a 404.
   *
   * @param c - The Hono context object
   * @returns 302 redirect to the login page with an error
   * @access public
   */
  .get("/callback", async (c) => {
    return appRedirect(c, "/login?oauthError=saml_failed");
  });
