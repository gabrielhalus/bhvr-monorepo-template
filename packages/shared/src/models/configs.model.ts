import { boolean, index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { UsersModel } from "~shared/models/users.model";

export const ConfigModel = pgTable("configs", {
  configKey: varchar("config_key", { length: 255 }).primaryKey(),
  value: text("value"),
  type: varchar("type", { length: 16 }).$type<"string" | "number" | "boolean" | "list" | "node">().notNull(),
  nullable: boolean("nullable").notNull(),
  multiline: boolean("multiline").notNull().default(false),
  secret: boolean("secret").notNull().default(false),
  options: text("options"),
  disabledWhen: text("disabled_when"),
  order: integer("order").notNull().default(0),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar("updated_by", { length: 21 }).references(() => UsersModel.id),
}, table => [
  index("idx_config_key_prefix").on(table.configKey),
]);
