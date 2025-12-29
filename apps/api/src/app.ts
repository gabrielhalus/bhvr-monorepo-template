import { Hono } from "hono";
import { logger } from "hono/logger";

import cors from "@bunstack/api/middlewares/cors";
import { authRoutes } from "@bunstack/api/routes/auth";
import { rolesRoutes } from "@bunstack/api/routes/roles";
import { usersRoutes } from "@bunstack/api/routes/users";

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
  .route("/users", usersRoutes);

export default app;
export type AppType = typeof _api;
