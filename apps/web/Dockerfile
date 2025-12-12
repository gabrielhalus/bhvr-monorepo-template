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

# Install production dependencies separately
FROM install AS install-prod
RUN mkdir -p /temp/prod
COPY bun.lock package.json turbo.json ./ 
RUN bun install --frozen-lockfile --production

# -----------------------------
# Build the app
# -----------------------------
FROM install AS build
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
