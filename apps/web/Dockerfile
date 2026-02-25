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

# Vite bakes VITE_* env vars into the JS bundle at build time
ARG VITE_API_URL=/api
ARG VITE_AUTH_URL=http://localhost
ARG VITE_SITE_URL=http://localhost
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AUTH_URL=$VITE_AUTH_URL
ENV VITE_SITE_URL=$VITE_SITE_URL

RUN bun run build --filter=@bunstack/web...

# -----------------------------
# Prepare final Nginx image
# -----------------------------
FROM nginx:stable-alpine AS release

# Copy built files
COPY --from=build /usr/src/app/apps/web/dist /usr/share/nginx/html
COPY --from=build /usr/src/app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port and start
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
