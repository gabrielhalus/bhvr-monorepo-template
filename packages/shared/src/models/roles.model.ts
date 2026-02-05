import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const RolesModel = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  index: integer("index").notNull().unique(),
  isDefault: boolean("is_default").notNull().default(false),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});
