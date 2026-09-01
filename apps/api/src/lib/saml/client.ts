import type { NormalizedProfile } from "@/lib/oauth/providers";
import type { Profile } from "@node-saml/node-saml";

import { SAML, ValidateInResponseTo } from "@node-saml/node-saml";
import { Buffer } from "node:buffer";
import { inflateRawSync } from "node:zlib";
import { ENV } from "varlock/env";

import { getConfig } from "~shared/queries/configs.queries";

/** Claims usable as the account identifier, mirroring the config registry options. */
const SAML_IDENTIFIERS = ["nameID", "email", "upn"] as const;
type SamlIdentifier = (typeof SAML_IDENTIFIERS)[number];

/** The UPN attribute name emitted by ADFS and Azure AD. */
const UPN_ATTRIBUTE = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn";

/** Where the IdP posts its assertion. */
export function acsUrl(): string {
  return `${ENV.API_URL}/auth/saml/callback`;
}

/** Raised when an assertion cannot be turned into a usable identity. */
export class SamlProfileError extends Error {
  constructor(public code: "email_missing" | "saml_failed") {
    super(`SAML profile error: ${code}`);
  }
}

export type SamlSettings = {
  entryPoint: string;
  idpIssuer: string;
  idpCert: string;
  spEntityId: string;
  identifier: SamlIdentifier;
  attrEmail: string;
  attrFirstName: string;
  attrLastName: string;
  signatureAlgorithm: "sha256" | "sha512";
  wantAssertionsSigned: boolean;
  wantAuthnResponseSigned: boolean;
  spPrivateKey: string | null;
  spCert: string | null;
};

/**
 * Read the admin-configured SAML settings.
 * @returns The settings, or null when SAML is disabled or incompletely
 * configured — the three fields with no sensible default being where to send
 * the request, who signs the answer, and who the answer claims to be from.
 */
export async function getSamlSettings(): Promise<SamlSettings | null> {
  const keys = [
    "enable",
    "entryPoint",
    "idpIssuer",
    "idpCert",
    "spEntityId",
    "identifier",
    "attrEmail",
    "attrFirstName",
    "attrLastName",
    "signatureAlgorithm",
    "wantAssertionsSigned",
    "wantAuthnResponseSigned",
    "spPrivateKey",
    "spCert",
  ] as const;

  const rows = await Promise.all(keys.map(k => getConfig(`authentication.saml.${k}`)));
  const cfg = Object.fromEntries(keys.map((k, i) => [k, rows[i]?.value ?? null])) as Record<(typeof keys)[number], string | null>;

  if (cfg.enable !== "true" || !cfg.entryPoint || !cfg.idpCert || !cfg.idpIssuer) {
    return null;
  }

  const identifier = SAML_IDENTIFIERS.find(i => i === cfg.identifier) ?? "nameID";

  return {
    entryPoint: cfg.entryPoint,
    idpIssuer: cfg.idpIssuer,
    idpCert: cfg.idpCert,
    // The SP entity id is what the IdP registered us as; falling back to the
    // API URL matches what `generateServiceProviderMetadata` publishes.
    spEntityId: cfg.spEntityId || ENV.API_URL,
    identifier,
    attrEmail: cfg.attrEmail || "urn:oid:0.9.2342.19200300.100.1.3",
    attrFirstName: cfg.attrFirstName || "urn:oid:2.5.4.42",
    attrLastName: cfg.attrLastName || "urn:oid:2.5.4.4",
    signatureAlgorithm: cfg.signatureAlgorithm === "sha512" ? "sha512" : "sha256",
    wantAssertionsSigned: cfg.wantAssertionsSigned !== "false",
    wantAuthnResponseSigned: cfg.wantAuthnResponseSigned === "true",
    spPrivateKey: cfg.spPrivateKey,
    spCert: cfg.spCert,
  };
}

/**
 * Build a node-saml instance from the configured settings.
 *
 * `validateInResponseTo` is left off: the `saml_flows` table already consumes
 * the request id atomically, which is the same guarantee node-saml's own cache
 * would give without a second store to keep in sync.
 *
 * @param settings - The configured SAML settings.
 * @returns A SAML instance ready to build requests and validate responses.
 */
export function buildSamlClient(settings: SamlSettings): SAML {
  return new SAML({
    entryPoint: settings.entryPoint,
    issuer: settings.spEntityId,
    callbackUrl: acsUrl(),
    idpCert: settings.idpCert,
    audience: settings.spEntityId,
    idpIssuer: settings.idpIssuer,
    wantAssertionsSigned: settings.wantAssertionsSigned,
    wantAuthnResponseSigned: settings.wantAuthnResponseSigned,
    signatureAlgorithm: settings.signatureAlgorithm,
    // Signing the AuthnRequest is optional and only possible once an admin has
    // supplied a keypair; without one we send it unsigned.
    ...(settings.spPrivateKey && {
      privateKey: settings.spPrivateKey,
      ...(settings.spCert && { publicCert: settings.spCert }),
    }),
    validateInResponseTo: ValidateInResponseTo.never,
  });
}

/**
 * Pull the AuthnRequest id back out of an authorization URL.
 *
 * node-saml does not return it, and it is the key the assertion will echo in
 * `InResponseTo` — so it has to be recovered from the request itself. The
 * HTTP-Redirect binding carries it DEFLATE-compressed with no zlib wrapper,
 * hence `inflateRawSync` rather than `inflateSync`.
 *
 * @param url - The authorization URL built for the IdP.
 * @returns The `ID` attribute of the AuthnRequest.
 * @throws {Error} If the URL carries no request, or the request no id.
 */
export function extractRequestId(url: string): string {
  const encoded = new URL(url).searchParams.get("SAMLRequest");
  if (!encoded) {
    throw new Error("SAMLRequest missing from the authorization URL");
  }

  const xml = inflateRawSync(Buffer.from(encoded, "base64")).toString("utf8");
  const match = xml.match(/\bID="([^"]+)"/);

  if (!match?.[1]) {
    throw new Error("AuthnRequest carries no ID");
  }

  return match[1];
}

/**
 * Read a SAML attribute, tolerating the shapes node-saml produces.
 *
 * Attributes land both in an `attributes` bag and flattened onto the profile
 * itself; neither is declared on the `Profile` type, which reaches them through
 * its index signature. Multi-valued attributes arrive as arrays.
 */
function attr(profile: Profile, name: string): string | null {
  const bag = profile.attributes;
  const fromBag = bag && typeof bag === "object" ? (bag as Record<string, unknown>)[name] : undefined;
  const raw = fromBag ?? profile[name];
  const value = Array.isArray(raw) ? raw[0] : raw;

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Split a display name into first/last.
 *
 * A single-word name fills the first name only: the missing half is reported
 * as absent so the signup flow can ask for it, which beats duplicating the
 * one word into both fields.
 */
function splitName(name: string | null): { firstName: string | null; lastName: string | null } {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const [first, ...rest] = parts;

  return {
    firstName: first ?? null,
    lastName: rest.join(" ") || null,
  };
}

/**
 * Normalize a validated assertion into the shared profile shape.
 *
 * The email is marked verified unconditionally: an assertion the IdP signed is
 * the IdP vouching for the identity, and SAML has no `email_verified` claim to
 * consult. This mirrors how the OIDC path treats a non-email identifier.
 *
 * @param profile - The profile node-saml extracted from the assertion.
 * @param settings - The configured attribute mapping.
 * @returns The normalized profile.
 * @throws {SamlProfileError} If no usable identifier is present.
 */
export function normalizeSamlProfile(profile: Profile, settings: SamlSettings): NormalizedProfile {
  const chosen = settings.identifier === "nameID"
    ? profile.nameID
    : settings.identifier === "upn"
      ? attr(profile, UPN_ATTRIBUTE)
      : attr(profile, settings.attrEmail);

  // Fall back through the other two so a misconfigured identifier degrades to
  // a working login rather than a dead end.
  const identifier = chosen || attr(profile, settings.attrEmail) || profile.nameID || null;

  if (!identifier) {
    throw new SamlProfileError("email_missing");
  }

  const firstName = attr(profile, settings.attrFirstName);
  const lastName = attr(profile, settings.attrLastName);
  const fallback = splitName(attr(profile, "displayName") ?? attr(profile, "urn:oid:2.16.840.1.113730.3.1.241"));

  return {
    // `nameID` is the stable subject identifier; it is what the IdP will send
    // again on the next login, so it is what the account is keyed on.
    providerAccountId: profile.nameID || identifier,
    email: identifier.toLowerCase(),
    emailVerified: true,
    firstName: firstName ?? fallback.firstName,
    lastName: lastName ?? fallback.lastName,
    avatarUrl: null,
  };
}
