/** Subset of the OIDC discovery document the SSO provider relies on. */
export type OIDCDiscoveryDocument = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
};

const DISCOVERY_TTL_MS = 10 * 60 * 1000;
const DISCOVERY_TIMEOUT_MS = 5000;

const cache = new Map<string, { doc: OIDCDiscoveryDocument; fetchedAt: number }>();

/**
 * Normalize an admin-supplied issuer URL: strip a trailing slash and a
 * mistakenly pasted `/.well-known/openid-configuration` suffix.
 */
export function normalizeIssuerUrl(issuerUrl: string): string {
  return issuerUrl
    .trim()
    .replace(/\/\.well-known\/openid-configuration\/?$/, "")
    .replace(/\/+$/, "");
}

/**
 * Fetch (and cache) the OIDC discovery document of an issuer.
 * @param issuerUrl - Base URL of the OpenID Connect issuer.
 * @returns The discovery document.
 * @throws When the document cannot be fetched or misses required endpoints.
 */
export async function getDiscoveryDocument(issuerUrl: string): Promise<OIDCDiscoveryDocument> {
  const issuer = normalizeIssuerUrl(issuerUrl);

  const cached = cache.get(issuer);
  if (cached && Date.now() - cached.fetchedAt < DISCOVERY_TTL_MS) {
    return cached.doc;
  }

  const res = await fetch(`${issuer}/.well-known/openid-configuration`, {
    signal: AbortSignal.timeout(DISCOVERY_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`OIDC discovery failed for ${issuer}: ${res.status}`);
  }

  const doc = await res.json() as Partial<OIDCDiscoveryDocument>;
  if (!doc.authorization_endpoint || !doc.token_endpoint) {
    throw new Error(`OIDC discovery document of ${issuer} misses required endpoints`);
  }

  const validated: OIDCDiscoveryDocument = {
    issuer: doc.issuer ?? issuer,
    authorization_endpoint: doc.authorization_endpoint,
    token_endpoint: doc.token_endpoint,
    userinfo_endpoint: doc.userinfo_endpoint,
  };

  cache.set(issuer, { doc: validated, fetchedAt: Date.now() });
  return validated;
}
