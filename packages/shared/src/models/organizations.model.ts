import { json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { nanoid } from "~shared/lib/nanoid";

export const OrganizationsModel = pgTable("organizations", {
  id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  /** DNS-label used as the organization's subdomain ({slug}.BASE_DOMAIN) */
  slug: varchar("slug", { length: 63 }).notNull().unique(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
});
