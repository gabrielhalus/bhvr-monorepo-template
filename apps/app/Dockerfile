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

ARG APP_URL
ENV APP_URL=$APP_URL

# Short commit hash injected into the bundle (no .git in the build context)
ARG BUILD_HASH
ENV BUILD_HASH=$BUILD_HASH

RUN bun run build --filter=app...

# -----------------------------
# Prepare final Nginx image
# -----------------------------
FROM nginx:stable-alpine AS release

# Copy built files
COPY --from=build /usr/src/app/apps/app/dist /usr/share/nginx/html
COPY --from=build /usr/src/app/apps/app/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port and start
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
