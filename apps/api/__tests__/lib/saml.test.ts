import type { SamlSettings } from "@/lib/saml/client";
import type { Profile } from "@node-saml/node-saml";

import { describe, expect, it, mock } from "bun:test";
import { Buffer } from "node:buffer";
import { deflateRawSync } from "node:zlib";

const mockEnv = {
  APP_ENV: "development",
  APP_URL: "http://localhost:3001",
  API_URL: "http://localhost:3000",
};

mock.module("varlock/env", () => ({ ENV: mockEnv }));
mock.module("~shared/queries/configs.queries", () => ({ getConfig: mock(async () => null) }));

const { extractRequestId, normalizeSamlProfile, SamlProfileError } = await import("@/lib/saml/client");

const settings: SamlSettings = {
  entryPoint: "https://idp.example.com/sso",
  idpIssuer: "https://idp.example.com/metadata",
  idpCert: "cert",
  spEntityId: "http://localhost:3000",
  identifier: "nameID",
  attrEmail: "urn:oid:0.9.2342.19200300.100.1.3",
  attrFirstName: "urn:oid:2.5.4.42",
  attrLastName: "urn:oid:2.5.4.4",
  signatureAlgorithm: "sha256",
  wantAssertionsSigned: true,
  wantAuthnResponseSigned: false,
  spPrivateKey: null,
  spCert: null,
};

/** Build a profile the way node-saml hands one over: bag plus flattened keys. */
function profileOf(nameID: string, attributes: Record<string, unknown> = {}): Profile {
  return {
    issuer: settings.idpIssuer,
    nameID,
    nameIDFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    attributes,
    ...attributes,
  } as unknown as Profile;
}

function authorizeUrl(xml: string): string {
  const deflated = deflateRawSync(Buffer.from(xml, "utf8")).toString("base64");
  return `https://idp.example.com/sso?SAMLRequest=${encodeURIComponent(deflated)}`;
}

describe("extractRequestId", () => {
  it("recovers the id from a DEFLATE-compressed AuthnRequest", () => {
    const url = authorizeUrl(`<samlp:AuthnRequest ID="_abc123" Version="2.0"/>`);
    expect(extractRequestId(url)).toBe("_abc123");
  });

  it("throws when the URL carries no SAMLRequest", () => {
    expect(() => extractRequestId("https://idp.example.com/sso")).toThrow(/SAMLRequest missing/);
  });

  it("throws when the request carries no ID", () => {
    const url = authorizeUrl(`<samlp:AuthnRequest Version="2.0"/>`);
    expect(() => extractRequestId(url)).toThrow(/no ID/);
  });
});

describe("normalizeSamlProfile", () => {
  it("keys the account on nameID and reads the mapped name attributes", () => {
    const profile = profileOf("alice@cea.fr", {
      "urn:oid:2.5.4.42": "Alice",
      "urn:oid:2.5.4.4": "Martin",
    });

    expect(normalizeSamlProfile(profile, settings)).toEqual({
      providerAccountId: "alice@cea.fr",
      email: "alice@cea.fr",
      emailVerified: true,
      firstName: "Alice",
      lastName: "Martin",
      avatarUrl: null,
    });
  });

  it("lowercases the identifier", () => {
    const profile = profileOf("Alice@CEA.fr");
    expect(normalizeSamlProfile(profile, settings).email).toBe("alice@cea.fr");
  });

  it("takes the first value of a multi-valued attribute", () => {
    const profile = profileOf("alice@cea.fr", { "urn:oid:2.5.4.42": ["Alice", "Alicia"] });
    expect(normalizeSamlProfile(profile, settings).firstName).toBe("Alice");
  });

  it("reports a missing name half as absent rather than duplicating the other", () => {
    const profile = profileOf("alice@cea.fr", { "urn:oid:2.5.4.42": "Alice" });
    const result = normalizeSamlProfile(profile, settings);

    expect(result.firstName).toBe("Alice");
    expect(result.lastName).toBeNull();
  });

  it("falls back to the email attribute when the identifier claim is empty", () => {
    const profile = profileOf("", { "urn:oid:0.9.2342.19200300.100.1.3": "bob@cea.fr" });
    expect(normalizeSamlProfile(profile, settings).email).toBe("bob@cea.fr");
  });

  it("reads the UPN attribute when configured to", () => {
    const profile = profileOf("SOME-OPAQUE-ID", {
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn": "carol@cea.fr",
    });
    const result = normalizeSamlProfile(profile, { ...settings, identifier: "upn" });

    expect(result.email).toBe("carol@cea.fr");
    // The account still keys on nameID: that is what the IdP will resend.
    expect(result.providerAccountId).toBe("SOME-OPAQUE-ID");
  });

  it("splits a display name when no name attributes are mapped", () => {
    const profile = profileOf("dave@cea.fr", { displayName: "Dave Le Roux" });
    const result = normalizeSamlProfile(profile, settings);

    expect(result.firstName).toBe("Dave");
    expect(result.lastName).toBe("Le Roux");
  });

  it("throws when no usable identifier is present", () => {
    expect(() => normalizeSamlProfile(profileOf(""), settings)).toThrow(SamlProfileError);
  });

  it("trusts the IdP for the email: a signed assertion is the vouching", () => {
    expect(normalizeSamlProfile(profileOf("eve@cea.fr"), settings).emailVerified).toBe(true);
  });
});
