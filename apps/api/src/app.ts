import { Hono } from "hono";
import { logger } from "hono/logger";

import { getClientInfo } from "@/helpers/get-client-info";
import cors from "@/middlewares/cors";
import { auditLogsRoutes } from "@/routes/audit-logs.routes";
import { authRoutes } from "@/routes/auth.routes";
import { invitationsRoutes } from "@/routes/invitations.routes";
import { rolesRoutes } from "@/routes/roles.routes";
import { configRoutes } from "@/routes/runtime-configs.routes";
import { usersRoutes } from "@/routes/users.routes";
import { logSystemError } from "~shared/queries/audit-logs.queries";

import { env } from "./lib/env";

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
// API (Hono @ port 3030)
// -------------------
const _api = app
  .route("/audit-logs", auditLogsRoutes)
  .route("/auth", authRoutes)
  .route("/invitations", invitationsRoutes)
  .route("/roles", rolesRoutes)
  .route("/config", configRoutes)
  .route("/users", usersRoutes);
app.onError(async (err, c) => {
  const { method, path } = c.req;
  const clientInfo = getClientInfo(c);

  console.error(`[ERREUR API] ${method} ${path}`);
  console.error(`Message: ${err.message}`);
  console.error(`Stack: ${err.stack}`);

  try {
    await logSystemError(err.message, clientInfo, { stack: err.stack, path, method });
  } catch (logErr) {
    console.error("Échec de l'enregistrement du log d'audit:", logErr);
  }

  const isDev = env.NODE_ENV === "development";

  return c.json({
    success: false,
    error: isDev ? err.message : "Une erreur interne est survenue",
    ...(isDev && { stack: err.stack }),
  }, 500);
});

export default app;
export type AppType = typeof _api;
