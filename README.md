
<p align="left">
  <img src="https://img.shields.io/badge/Bun-000?logo=bun&logoColor=fff&style=for-the-badge" alt="Bun Badge">
  <img src="https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=fff&style=for-the-badge" alt="Hono Badge">
  <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff&style=for-the-badge" alt="Vite Badge">
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000&style=for-the-badge" alt="React Badge">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=fff&style=for-the-badge" alt="PostgreSQL Badge">
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff&style=for-the-badge" alt="Docker Badge">
</p>

## Deployment

The stack needs **no URL configuration**. It discovers the origin it is served
from at runtime, so the same image runs behind `localhost`, a LAN IP, a `.local`
hostname or a real domain:

```bash
docker compose up
# → http://<any-host>:3000
```

Change the host port with `PORT`, and set a real `POSTGRES_PASSWORD` before
exposing the stack. Everything else — branding, mail, S3, OAuth credentials — is
configured from the Settings screen and stored in the database.

Behind an extra reverse proxy (Caddy, Traefik, nginx), forward the standard
`X-Forwarded-*` headers and set `TRUSTED_PROXY_HOPS=2`:

```caddyfile
example.com {
    reverse_proxy localhost:3000
}
```

> Full reference: [Environment variables](docs/env.md).

## Development

### 1. Clone the repository

```bash
git clone https://github.com/gabrielhalus/bunstack.git --depth=1
cd bunstack
```

### 2. Install dependencies

```bash
bun install
```

### 3. Start the infrastructure

Postgres, Redis and MinIO run in Docker; the apps run on the host.

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 4. Set up the database

```bash
bun run drizzle:migrate
bun run bootstrap
```

`bootstrap` seeds the runtime configuration and prints the credentials of the
initial system account — store them, they are shown once.

### 5. Configure the environment (optional)

Defaults in `apps/api/.env.schema` and `apps/app/.env.schema` match the compose
file above, so no `.env` is required. To override a value, create an `.env` next
to the schema:

```bash
# apps/api/.env
REDIS_URL=redis://localhost:6379
```

> See [Environment variables](docs/env.md) for the full list.

### 6. Start the dev servers

```bash
bun run dev
```

The Vite dev server proxies `/api` to the API on port 3000, so the browser talks
to a single origin — the same shape as production.

Or start them individually:

```bash
# API — http://localhost:3000
cd apps/api && bun run dev

# Dashboard — http://localhost:5173
cd apps/app && bun run dev
```

## Linting (ESLint)

This monorepo includes ESLint configs for all apps and packages. To check code style and catch errors, run:

```bash
bun run lint
```

This will run linting across all workspaces.

Make sure to fix lint warnings/errors before committing to maintain code quality.

## Author

Gabriel Halus https://github.com/gabrielhalus

## License

Distribued under the CC BY-NC 4.0 License. See [LICENSE](https://github.com/gabrielhalus/bunstack/blob/main/LICENSE) for more information.
