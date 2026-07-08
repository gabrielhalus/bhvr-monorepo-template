import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";

import { getClientInfo } from "@/helpers/get-client-info";
import { requireFeatureFactory } from "@/middlewares/access-control";
import cors from "@/middlewares/cors";
import { resolveOrgContext } from "@/middlewares/org-context";
import { rateLimiter, rateLimitPresets } from "@/middlewares/rate-limit";
import { adminRoutes } from "@/routes/admin";
import { authRoutes } from "@/routes/auth.routes";
import { backupRoutes } from "@/routes/backup.routes";
import { brandingRoutes } from "@/routes/branding.routes";
import { configRoutes } from "@/routes/configs.routes";
import { cronTasksRoutes } from "@/routes/cron-tasks.routes";
import { featuresRoutes } from "@/routes/features.routes";
import { invitationsRoutes } from "@/routes/invitations.routes";
import { logsRoutes } from "@/routes/logs.routes";
import { oauthRoutes } from "@/routes/oauth.routes";
import { organizationsRoutes } from "@/routes/organizations.routes";
import { rolesRoutes } from "@/routes/roles.routes";
import { usersRoutes } from "@/routes/users.routes";
import { logSystemError } from "~shared/queries/logs.queries";

const app = new Hono({ strict: false });

// -------------------
// Global Error Handler
// -------------------
app.onError(async (err, c) => {
  // Intentional HTTP errors (e.g. requireOrg's 404) keep their status —
  // they are neither 500s nor system errors to log.
  if (err instanceof HTTPException) {
    return c.json({ success: false, error: err.message || "Request failed" }, err.status);
  }

  const clientInfo = getClientInfo(c);

  // Log the error to audit logs (fire and forget)
  logSystemError(err.message, {
    ip: clientInfo.ip,
    userAgent: clientInfo.userAgent,
  }, {
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  }).catch(() => {
    // Silently fail audit logging
  });

  console.error(`[Error] ${c.req.method} ${c.req.path}:`, err);

  return c.json({ success: false, error: "Internal Server Error" }, 500);
});

// -------------------
// Global Middlewares
// -------------------
app.use(logger());

// -------------------
// Dynamic CORS
// -------------------
app.use(cors());

// -------------------
// Rate Limiter
// -------------------
app.use(rateLimiter(rateLimitPresets.api));

// -------------------
// Organization Resolution
// -------------------
app.use(resolveOrgContext);

// -------------------
// API (Hono @ port 5173)
// -------------------
// Flag-gated features answer 404 when disabled for the resolved org
app.use("/backups/*", requireFeatureFactory("backups"));
app.use("/cron-tasks/*", requireFeatureFactory("cron-ui"));
app.use("/invitations/*", requireFeatureFactory("invitations"));

const _api = app
  .route("/branding", brandingRoutes)
  .route("/auth/oauth", oauthRoutes)
  .route("/auth", authRoutes)
  .route("/backups", backupRoutes)
  .route("/config", configRoutes)
  .route("/cron-tasks", cronTasksRoutes)
  .route("/features", featuresRoutes)
  .route("/invitations", invitationsRoutes)
  .route("/logs", logsRoutes)
  .route("/organization", organizationsRoutes)
  .route("/roles", rolesRoutes)
  .route("/users", usersRoutes);

// Platform administration surface — separate RPC type so the tenant app's
// hc<> inference doesn't grow with admin routes.
const _admin = new Hono({ strict: false }).route("/admin", adminRoutes);
app.route("/", _admin);

export default app;
export type AppType = typeof _api;
export type AdminAppType = typeof _admin;
