# -----------------------------
# Base image with Bun
# -----------------------------
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# -----------------------------
# Install dependencies
# -----------------------------
FROM base AS install

# Copy only essential files for install
COPY bun.lock package.json turbo.json .env.shared.schema ./
COPY apps ./apps
COPY packages ./packages

# Install dev dependencies (for building)
RUN bun install --frozen-lockfile

# -----------------------------
# Build the app
# -----------------------------
FROM install AS build
RUN bun run build --filter=api...

# -----------------------------
# Prepare final runtime image
# -----------------------------
FROM base AS release

# Install PostgreSQL client tools (pg_dump / pg_restore) for DB backups.
# Uses the base distro package (oven/bun:1 is Debian trixie → client 17), which
# dumps/restores a PostgreSQL 16 server fine — avoids the PGDG repo + GPG key
# dance that breaks when the base image's Debian codename changes.
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy built files
COPY --from=install /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/apps ./apps
COPY --from=build /usr/src/app/packages ./packages
COPY package.json bun.lock turbo.json .env.shared.schema ./

EXPOSE 3000/tcp
ENTRYPOINT ["bun", "run", "apps/api/src/index.ts"]
