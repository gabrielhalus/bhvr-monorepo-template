import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { UsersModel } from "~shared/models/users.model";

export const ConfigModel = pgTable("configs", {
  configKey: varchar("config_key", { length: 255 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar("updated_by", { length: 21 }).references(() => UsersModel.id),
});
