import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { nanoid } from "~shared/lib/nanoid";
import { UsersModel } from "~shared/db/models/users.model";

export const InvitationsModel = pgTable("invitations", {
  id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
  email: text("email").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("pending").$type<"pending" | "accepted" | "expired" | "revoked">(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  invitedById: varchar("invited_by_id", { length: 21 }).notNull().references(() => UsersModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  acceptedAt: timestamp("accepted_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});
