# SAML 2.0

SAML sign-in, alongside the OAuth 2.0 / OIDC providers. Everything is configured at runtime — see [Runtime Configs](runtime-configs.md) — so no redeploy is needed to point the app at an identity provider.

Reference code: `apps/api/src/lib/saml/client.ts`, `apps/api/src/routes/saml.routes.ts`, `apps/api/src/services/provider-identity.ts`.

## How it fits with OAuth

SAML does not go through the OAuth 2.0 authorization-code routes: there is no `code`, no PKCE, no token endpoint. The assertion the IdP posts back **is** the profile.

What the two protocols do share is everything that happens *after* an identity is established — signing in a known account, holding a signup open, challenging for a link. That half lives in `services/provider-identity.ts` and is called by both.

```
/auth/oauth/:provider/callback ──┐
                                 ├──> resolveProviderIdentity()
/auth/saml/callback ─────────────┘
```

A SAML identity is stored in `oauth_accounts` like any other. The table name predates SAML; an account linked to an IdP is the same domain object whichever protocol vouched for it, and reusing the table keeps linking, unlinking and the uniqueness constraints in one place.

## Routes

| Route | Binding | Role |
| --- | --- | --- |
| `GET /auth/saml/metadata` | — | SP metadata, to register with the IdP |
| `GET /auth/saml/login` | HTTP-Redirect | Builds the AuthnRequest and redirects to the IdP |
| `POST /auth/saml/callback` | HTTP-POST | Assertion consumer service |
| `GET /auth/saml/callback` | — | Rejected: the ACS only accepts POST |

## Flow state is not a cookie

The IdP answers with a **cross-site POST** to the ACS. On that request the browser withholds `SameSite=Lax` cookies — which is what cookies get in plain-port development (see `getCookieSettings` in `lib/jwt.ts`). A cookie-based flow would therefore work in production and break in development, silently.

So the flow lives in the `saml_flows` table instead, keyed by the `ID` of the AuthnRequest, which the IdP echoes back as `InResponseTo`.

That same row is the **replay guard**: `consumeSamlFlow` marks it consumed in the same statement that reads it, so a replayed assertion finds nothing to consume and is rejected. This is why `validateInResponseTo` is left off in the node-saml client — the guarantee is already there, and a second store would only be one more thing to keep in sync.

Assertions with no `InResponseTo` — IdP-initiated sign-in — are rejected: there is no request of ours to match them against.

## Configuration

| Key | Notes |
| --- | --- |
| `authentication.saml.enable` | |
| `authentication.saml.entryPoint` | The IdP's SSO URL |
| `authentication.saml.idpIssuer` | The IdP's EntityID, validated on every assertion |
| `authentication.saml.idpCert` | The IdP's signing certificate (PEM) |
| `authentication.saml.spEntityId` | Defaults to `API_URL` |
| `authentication.saml.identifier` | `nameID`, `email` or `upn` |
| `authentication.saml.attrEmail` / `attrFirstName` / `attrLastName` | Attribute mapping |
| `authentication.saml.signatureAlgorithm` | `sha256` or `sha512` |
| `authentication.saml.wantAssertionsSigned` | Default `true` |
| `authentication.saml.wantAuthnResponseSigned` | Default `false` |
| `authentication.saml.spPrivateKey` / `spCert` | Optional, to sign AuthnRequests |
| `authentication.saml.buttonLabel`, `autoLogin` | Mirror the SSO provider |

SAML is only offered on the login page once `enable`, `entryPoint`, `idpIssuer` and `idpCert` are all set — the three fields with no sensible default being where to send the request, who signs the answer, and who the answer claims to be from.

### Attribute mapping

Identity providers are wildly inconsistent about attribute names. The defaults are the LDAP/X.500 OIDs, which is what most enterprise IdPs emit:

| Field | Default | Azure AD / ADFS alternative |
| --- | --- | --- |
| Email | `urn:oid:0.9.2342.19200300.100.1.3` | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress` |
| First name | `urn:oid:2.5.4.42` | `.../claims/givenname` |
| Last name | `urn:oid:2.5.4.4` | `.../claims/surname` |

When `identifier` is `upn`, the UPN claim (`.../claims/upn`) is read instead — for IdPs that expose no email.

The account is always keyed on `nameID`, whatever the identifier: that is the stable subject the IdP will resend on the next login.

### Signing AuthnRequests

Optional, and only possible once a keypair is configured. Generate one with:

```bash
openssl req -x509 -newkey rsa:2048 -keyout sp-key.pem -out sp-cert.pem -days 3650 -nodes -subj "/CN=your-app"
```

Paste `sp-key.pem` into `spPrivateKey` and `sp-cert.pem` into `spCert`. Without them the AuthnRequest is sent unsigned, which most IdPs accept.

Rotating the keypair means re-uploading the SP metadata to the IdP.

## Email verification

A SAML profile is always marked `emailVerified: true`. SAML has no `email_verified` claim, and an assertion the IdP signed *is* the IdP vouching for the identity — the same reasoning the OIDC path applies to a non-email identifier.

Like SSO, SAML bypasses the registration policy: the IdP is the source of truth for who may sign in.

## Errors

The raw node-saml message is never put on the redirect URL — it quotes XML and certificate internals that describe how validation was reached. It is logged server-side and mapped to one of `saml_failed`, `saml_invalid_signature`, `saml_assertion_expired`, `saml_audience_mismatch`, `saml_replay`.

## Not implemented

- **Single Logout (SLO)** — a protocol of its own (bindings, signed `LogoutRequest`, IdP session tracking). Few IdPs require it.
- **Encrypted assertions** — node-saml supports them via `decryptionPvk`; wire it up only if the IdP insists.
- **IdP-initiated SSO** — would mean relaxing the replay guard.
- **Multiple IdPs** — the runtime config holds one SAML provider.
