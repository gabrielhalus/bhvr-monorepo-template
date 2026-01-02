import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { UsersModel } from "@bunstack/shared/models/users.model";

export const RuntimeConfigModel = pgTable("runtime_config", {
  configKey: varchar("config_key", { length: 255 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  updatedBy: varchar("updated_by", { length: 21 }).references(() => UsersModel.id),
}, table => [
  index("idx_config_key_prefix").on(table.configKey),
]);
