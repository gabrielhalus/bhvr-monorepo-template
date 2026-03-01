# Environment Variables Guide

This document explains how environment variables are validated and used across development, production, and Docker environments.

## Overview

The monorepo uses **`validateEnv()`** from `@bunstack/shared` to validate environment variables at application startup. This ensures all required configuration is present before the app runs.

### Architecture

```
process.env / import.meta.env
         ↓
   validateEnv() [shared/env]
         ↓
  env.ts (per app/package)
         ↓
  application runtime
```

## Environment Layers

### 1. **Development** (`npm run dev`)

```
.env (root directory)
  ↓
apps/api/src/lib/env.ts    → validates API environment
apps/web/src/lib/env.ts    → validates Web environment
packages/react/src/lib/env.ts → validates React package environment
```

**Configuration file**: `.env` (in repository root)

```bash
NODE_ENV=development
HOSTNAME=localhost
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/db
JWT_SECRET=your-secret-key-min-32-chars
AUTH_URL=http://localhost:5173
SITE_URL=http://localhost:5173
VITE_API_URL=/api
VITE_AUTH_URL=http://localhost:5173
VITE_SITE_URL=http://localhost:5173
```

**How it works**:
- Each app loads `.env` via dotenv at startup
- `validateEnv()` parses and validates against Zod schemas
- If any required variable is missing/invalid, app crashes with clear error

### 2. **Docker Production** (`docker-compose up`)

```
.docker.env (Docker environment file)
  ↓
compose.yml (env_file: ".docker.env")
  ↓
Container environment variables
  ↓
apps/api/src/lib/env.ts    → validates API environment
apps/web/src/lib/env.ts    → validates Web environment
```

**Configuration file**: `.docker.env` (NOT in version control)

```bash
NODE_ENV=production
POSTGRES_USER=bunstack
POSTGRES_PASSWORD=secure-password
DATABASE_URL=postgres://bunstack:password@postgres:5432/bunstack
JWT_SECRET=secure-random-string-min-32-chars
AUTH_URL=https://your-domain.com
SITE_URL=https://your-domain.com
HOSTNAME=0.0.0.0
```

**How it works**:
- `docker-compose.yml` reads `.docker.env` via `env_file` directive
- Environment variables are passed to containers
- API detects `NODE_ENV=production` and **skips dotenv loading** (safer for production)
- `validateEnv()` reads from `process.env` directly

### 3. **Traditional Production** (Kubernetes, Cloud Platform, VPS)

```
Environment Variables (set by deployment platform)
  ↓
Container runtime
  ↓
apps/api/src/lib/env.ts    → validates API environment
```

**Configuration**: Set via deployment platform (e.g., Kubernetes secrets, Cloud Run env vars)

```bash
NODE_ENV=production
DATABASE_URL=postgres://user:pass@db-host:5432/bunstack
JWT_SECRET=secure-random-string
AUTH_URL=https://your-auth.com
SITE_URL=https://your-site.com
HOSTNAME=0.0.0.0
PORT=3000
```

**How it works**:
- Platform-specific secret/config management
- Environment variables injected at container start
- API skips dotenv loading (NODE_ENV=production)
- `validateEnv()` reads from `process.env`

## Validation Schemas

### API (`apps/api/src/lib/env.ts`)

| Variable | Type | Required | Notes |
|----------|------|----------|-------|
| `NODE_ENV` | enum | No | Default: "development" |
| `HOSTNAME` | string | No | Default: "localhost" |
| `PORT` | string | No | Default: "3000" |
| `DATABASE_URL` | string | **Yes** | Must be valid PostgreSQL URL |
| `JWT_SECRET` | string | **Yes** | Minimum 32 characters |
| `AUTH_URL` | URL | **Yes** | Must be valid URL |
| `SITE_URL` | URL | **Yes** | Must be valid URL |

**Behavior**:
- In development: Loads from `.env` using dotenv
- In production: Skips dotenv, reads directly from `process.env`
- Validates all required variables at startup

### Web (`apps/web/src/lib/env.ts`)

| Variable | Type | Required | Notes |
|----------|------|----------|-------|
| `VITE_API_URL` | string | **Yes** | Can be relative (e.g., `/api`) or absolute URL |
| `VITE_SITE_URL` | URL | **Yes** | Must be valid URL |
| `VITE_AUTH_URL` | URL | **Yes** | Must be valid URL |

**Behavior**:
- Validated at build time (Vite)
- Baked into bundle as inline strings
- Also validated at runtime via `import.meta.env`

### React Package (`packages/react/src/lib/env.ts`)

Same as Web (mirrors VITE_* variables).

## Setup Instructions

### Development Setup

1. **Copy template**:
   ```bash
   cp .env.example .env
   ```

2. **Update for your local setup**:
   ```bash
   # .env
   DATABASE_URL=postgres://your-user:your-pass@localhost:5432/bunstack
   JWT_SECRET=your-local-secret-min-32-chars
   ```

3. **Start dev server**:
   ```bash
   bun run dev
   ```

### Docker Setup

1. **Copy template**:
   ```bash
   cp .docker.env.example .docker.env
   ```

2. **Update for your environment**:
   ```bash
   # .docker.env
   POSTGRES_USER=myuser
   POSTGRES_PASSWORD=secure-password-here
   DATABASE_URL=postgres://myuser:secure-password-here@postgres:5432/bunstack
   JWT_SECRET=generate-with-openssl-rand-base64-32
   AUTH_URL=https://your-domain.com
   SITE_URL=https://your-domain.com
   ```

3. **Start containers**:
   ```bash
   docker-compose up -d
   ```

### Production Deployment

**Option A: Using environment variables**

Set these in your deployment platform (Kubernetes, Cloud Run, etc.):

```bash
NODE_ENV=production
DATABASE_URL=postgres://...
JWT_SECRET=...
AUTH_URL=https://your-domain.com
SITE_URL=https://your-domain.com
HOSTNAME=0.0.0.0
PORT=3000
```

**Option B: Using .env file** (if container has file system access)

```bash
# Create .env at container root
echo "DATABASE_URL=..." > /.env
```

## Security Best Practices

1. **Never commit secrets**:
   - `.env` should be in `.gitignore` ✓
   - `.docker.env` should be in `.gitignore` ✓

2. **Rotate JWT_SECRET regularly**:
   ```bash
   openssl rand -base64 32
   ```

3. **Use strong DATABASE passwords** in production

4. **Use HTTPS URLs** in production:
   ```bash
   AUTH_URL=https://auth.example.com  # not http://
   SITE_URL=https://app.example.com   # not http://
   ```

5. **Different secrets per environment**:
   - Development: Simple keys (for local testing)
   - Production: Strong, rotated keys (from secret manager)

## Troubleshooting

### "Invalid environment variables" Error

Check the error message for which variable is missing/invalid:

```
Invalid environment variables:
{
  "DATABASE_URL": ["Invalid url"],
  "JWT_SECRET": ["String must contain at least 32 character(s)"]
}
```

**Solutions**:
- Ensure `.env` exists (development)
- Ensure `.docker.env` exists (Docker)
- Verify URL format: `postgres://user:pass@host:port/db`
- Verify JWT_SECRET is at least 32 characters

### "DATABASE_URL is required" in Docker

**Cause**: `.docker.env` not found or DATABASE_URL not set

**Solution**:
```bash
cp .docker.env.example .docker.env
# Edit .docker.env with your values
docker-compose up -d
```

### Environment variables not loading in development

**Cause**: `.env` file not in correct location

**Solution**:
```bash
# Should be in repository root
ls .env  # Check if file exists
ls -la | grep .env  # Should show .env
```

### VITE_API_URL not working in production

**Cause**: Using relative path when absolute URL is needed

**Solutions**:
- For reverse proxy setup (nginx proxies /api): Use `VITE_API_URL=/api` ✓
- For separate domain (api.example.com): Use `VITE_API_URL=https://api.example.com` ✓

## Migration Guide: From Old Setup

If you're upgrading from an older env setup:

1. **API env.ts**: Now validates `DATABASE_URL` (was missing before)
2. **Web env.ts**: Now validates `VITE_API_URL` directly
3. **React env.ts**: Removed process.env.NODE_ENV check (unreliable at build time)
4. **All apps**: Production mode now skips dotenv for security

No breaking changes, but ensure `.env` / `.docker.env` includes all required variables.

## Testing Env Validation

```bash
# Development
NODE_ENV=development bun run dev

# Production (skips .env loading)
NODE_ENV=production DATABASE_URL=... bun run start

# Docker
docker-compose up -d
docker logs api  # Check for env validation errors
```
