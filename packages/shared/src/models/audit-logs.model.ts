import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { nanoid } from "~shared/lib/nanoid";

/**
 * Audit logs table for tracking security-sensitive actions and user activity.
 * Supports tracking of impersonated actions where the real actor differs from the session user.
 */
export const AuditLogsModel = pgTable("audit_logs", {
  id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
  /** The type of action being logged (e.g., "auth:login", "user:update") */
  action: varchar("action", { length: 100 }).notNull(),
  /** The user who performed the action (the session user) */
  actorId: varchar("actor_id", { length: 21 }).notNull(),
  /** If action was performed while impersonating, this is the real user (admin) */
  impersonatorId: varchar("impersonator_id", { length: 21 }),
  /** The target resource ID (user, role, etc.) */
  targetId: varchar("target_id", { length: 21 }),
  /** The type of target resource (e.g., "user", "role", "invitation") */
  targetType: varchar("target_type", { length: 50 }),
  /** Additional metadata about the action (JSON stringified) */
  metadata: text("metadata"),
  /** IP address of the actor */
  ip: varchar("ip", { length: 45 }),
  /** User agent of the actor */
  userAgent: text("user_agent"),
  /** When the action occurred */
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
});
