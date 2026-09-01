# Environment variables

The stack is designed to run **with no environment configuration at all**. It
discovers the origin it is served from at runtime, so the same image works on
`http://localhost:3000`, `http://192.168.1.50:3000`, `http://myapp.local` or
`https://example.com` without a rebuild and without a `.env` file.

```bash
docker compose up
# → http://<any-host>:3000
```

Everything below is optional. Variables are declared in `apps/*/. env.schema`
and resolved by [varlock](https://varlock.dev); `apps/*/env.d.ts` is generated
from those schemas (`bunx varlock typegen`) and must not be edited by hand.

## How the origin is discovered

The frontend is a static SPA served by nginx, which also proxies `/api/` to the
API container. Browser and API therefore share **one origin**:

```
Browser ──► nginx :80 ──┬── /        → SPA (static files)
                        └── /api/    → api:3000 (prefix stripped)
```

Because of that:

- the SPA calls the API through the relative `VITE_API_URL=/api`, so no hostname
  is baked into the bundle;
- the API answers browser redirects with a **relative** `Location`, which the
  browser resolves against whatever origin it used;
- links the frontend generates (invitations) come from `window.location.origin`;
- cookies are host-only with `SameSite=Lax` — no cookie `Domain` to configure,
  and `Secure` follows the scheme the browser actually used;
- no CORS header is needed, since nothing is ever cross-origin.

Only two things genuinely leave the HTTP context and need an absolute URL: the
**password reset email** and the **OAuth `redirect_uri`**. Both are derived from
the request by default and can be pinned — see below.

## API (`apps/api/.env.schema`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_ENV` | `development` | `development` or `production`. |
| `APP_PORT` | `3000` | Port the API listens on inside its container. |
| `DATABASE_URL` | — | **Required.** PostgreSQL connection string. |
| `REDIS_URL` | *(empty)* | Enables cross-instance rate limiting, BullMQ queues (emails, cron), the config/session/role caches and audit-log batching. Falls back to per-process in-memory stores when unset. |
| `TRUSTED_PROXY_HOPS` | `1` | Number of reverse proxies in front of the API. See below. |
| `ALLOWED_ORIGINS` | *(empty)* | CORS allowlist. Leave empty for the default same-origin deployment. |
| `OAUTH_REDIRECT_BASE` | *(derived)* | Base URL providers redirect back to. |
| `SYSTEM_RESET_PASSWORD` | `false` | Forces a system-account password reset on next restart. |
| `DEV_EMAIL_REDIRECT` | *(empty)* | Outside production, sends every outbound email to this address instead of the real recipient. |

### `TRUSTED_PROXY_HOPS`

Every reverse proxy appends the address it saw to `X-Forwarded-For`, so the real
client address is the **Nth entry from the right**. Everything further left was
supplied by the caller and is not trustworthy — reading the leftmost entry would
let anyone rotate a header value to bypass rate limiting and forge the IP stored
in the audit log.

| Topology | Value |
| --- | --- |
| API exposed directly, no proxy | `0` |
| Bundled compose (one nginx) — **default** | `1` |
| Extra edge proxy (Traefik/Caddy → nginx → API) | `2` |

Getting it wrong degrades IP accuracy in logs and rate-limit buckets; it does not
open a hole and does not break the app.

The same setting gates whether `X-Forwarded-Host` / `X-Forwarded-Proto` are
honoured when the API derives its public origin. With `0` it uses the request URL
only.

### `ALLOWED_ORIGINS`

Only needed if you serve the frontend from a *different* origin than the API
(`https://app.example.com` + `https://api.example.com`). Values are matched as
**full origins**, scheme and port included:

```bash
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

Leave it empty for the bundled setup. No CORS header is then emitted, which is
the safe default — the browser refuses any cross-origin read.

### `OAUTH_REDIRECT_BASE`

The callback URL handed to Google / GitHub / your OIDC provider is derived from
each request, so OAuth works on any hostname out of the box. Read the exact value
to register in the provider console from:

```
GET /api/auth/oauth/redirect-uris     (requires the config:list permission)
```

Set `OAUTH_REDIRECT_BASE` only when the browser-facing origin differs from the
registered one — an edge rewrite, a vanity domain, or the app mounted under a
sub-path:

```bash
OAUTH_REDIRECT_BASE=https://example.com/api
```

> Google rejects bare IP addresses as redirect URIs, so OAuth with Google is not
> available on a `http://192.168.x.x` deployment. GitHub and generic OIDC
> providers usually accept them.

## Frontend (`apps/app/.env.schema`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_ENV` | `development` | `development` or `production`. |
| `VITE_API_URL` | `/api` | Relative on purpose — resolved by the browser against the origin the app was loaded from. Change it only for a split-origin deployment (`https://api.example.com`). |

`VITE_*` values are inlined into the bundle at build time. Keeping `VITE_API_URL`
relative is what lets one built image run behind any domain.

## Docker Compose

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Host port the stack is published on. |
| `APP_ENV` | `production` | Passed to the API. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `postgres` / `admin` / `bunstack` | **Change the password for any real deployment.** |
| `REDIS_URL` | `redis://redis:6379` | Points at the bundled Redis. |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | `minioadmin` | Bundled MinIO credentials. |
| `S3_ENDPOINT` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` | bundled MinIO | Seeds the `storage.s3.*` runtime configs on first boot. |
| `BUILD_HASH` | *(empty)* | Commit hash shown in the build badge. |
| `TRUSTED_PROXY_HOPS`, `ALLOWED_ORIGINS`, `OAUTH_REDIRECT_BASE` | see above | Forwarded to the API. |

## Runtime configuration (database)

Some settings live in the `configs` table instead of the environment, so they can
be changed from the Settings screen without a redeploy: branding, SMTP/Resend
credentials, S3 connection, OAuth client IDs and secrets, the JWT secret.

`app.publicOrigin` belongs to that group and is worth knowing about:

- **Left empty** (default): URLs sent by email are derived from the request that
  triggered them. A fresh install works on any hostname with zero setup.
- **Set** (e.g. `https://example.com`): those links are pinned to that origin.

Pin it once you have a stable domain. It closes host-header injection on the
password-reset email — without it, a forged `Host` on `POST /auth/forgot-password`
can make a genuine reset mail point at an attacker's domain.

## Behind an extra reverse proxy

The bundled nginx forwards `Host`, `X-Forwarded-For`, `X-Forwarded-Proto` and
`X-Forwarded-Host`, preserving values an upstream proxy already set. A Caddy or
Traefik in front only needs to do the same, and `TRUSTED_PROXY_HOPS=2`:

```caddyfile
example.com {
    reverse_proxy localhost:3000
}
```

Caddy sets `X-Forwarded-Proto: https` itself, which the container's nginx now
passes through instead of overwriting — that is what keeps cookies `Secure` and
emailed links on `https://`.

## Not supported without configuration

Mounting the app under a **sub-path** (`https://example.com/myapp`) needs a
build-time base path: Vite inlines asset URLs into the bundle, so it cannot be
derived at runtime. That would require `base` in `vite.config.ts`, `basepath` on
the router, a matching nginx `location`, and `OAUTH_REDIRECT_BASE`. Serve the app
at a domain root, or at a subdomain, instead.
