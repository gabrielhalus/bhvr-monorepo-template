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
COPY bun.lock package.json turbo.json ./
COPY apps ./apps
COPY packages ./packages

# Install dev dependencies (for building)
RUN bun install --frozen-lockfile

# -----------------------------
# Build the app
# -----------------------------
FROM install AS build
RUN bun run build --filter=@bunstack/api...

# -----------------------------
# Prepare final runtime image
# -----------------------------
FROM base AS release

# Copy built files
COPY --from=install /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/apps ./apps
COPY --from=build /usr/src/app/packages ./packages
COPY package.json bun.lock turbo.json ./

EXPOSE 3000/tcp
ENTRYPOINT ["bun", "run", "apps/api/src/index.ts"]
