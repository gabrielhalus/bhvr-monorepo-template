import { Hono } from "hono";
import { logger } from "hono/logger";

import cors from "@/middlewares/cors";
import { authRoutes } from "@/routes/auth.routes";
import { rolesRoutes } from "@/routes/roles.routes";
import { configRoutes } from "@/routes/runtime-configs.routes";
import { usersRoutes } from "@/routes/users.routes";

const app = new Hono({ strict: false });

// -------------------
// Global Middlewares
// -------------------
app.use(logger());

// -------------------
// Dynamic CORS
// -------------------
app.use(cors());

// -------------------
// API (Hono @ port 4002)
// -------------------
const _api = app
  .route("/auth", authRoutes)
  .route("/roles", rolesRoutes)
  .route("/config", configRoutes)
  .route("/users", usersRoutes);

export default app;
export type AppType = typeof _api;
