import { Hono } from "hono";
import { logger } from "hono/logger";

import { getClientInfo } from "@/helpers/get-client-info";
import cors from "@/middlewares/cors";
import { rateLimiter, rateLimitPresets } from "@/middlewares/rate-limit";
import { auditLogsRoutes } from "@/routes/audit-logs.routes";
import { authRoutes } from "@/routes/auth.routes";
import { cronTasksRoutes } from "@/routes/cron-tasks.routes";
import { invitationsRoutes } from "@/routes/invitations.routes";
import { rolesRoutes } from "@/routes/roles.routes";
import { configRoutes } from "@/routes/runtime-configs.routes";
import { usersRoutes } from "@/routes/users.routes";
import { logSystemError } from "~shared/queries/audit-logs.queries";

const app = new Hono({ strict: false });

// -------------------
// Global Error Handler
// -------------------
app.onError(async (err, c) => {
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
// API (Hono @ port 5173)
// -------------------
const _api = app
  .route("/audit-logs", auditLogsRoutes)
  .route("/auth", authRoutes)
  .route("/cron-tasks", cronTasksRoutes)
  .route("/invitations", invitationsRoutes)
  .route("/roles", rolesRoutes)
  .route("/config", configRoutes)
  .route("/users", usersRoutes);

export default app;
export type AppType = typeof _api;
