import { sql } from "drizzle-orm";
import { boolean, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { OrganizationsModel } from "~shared/models/organizations.model";

/**
 * Domains that resolve to an organization. Subdomain rows ({slug}.BASE_DOMAIN)
 * are auto-managed from the organization slug and verified at creation;
 * custom domains require DNS verification before they resolve.
 */
export const OrganizationDomainsModel = pgTable("organization_domains", {
  id: serial("id").primaryKey(),
  organizationId: varchar("organization_id", { length: 21 }).notNull().references(() => OrganizationsModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  /** Stored lowercase, without port */
  domain: text("domain").notNull().unique(),
  type: varchar("type", { length: 12 }).notNull().$type<"subdomain" | "custom">(),
  isPrimary: boolean("is_primary").notNull().default(false),
  verificationToken: varchar("verification_token", { length: 64 }),
  verifiedAt: timestamp("verified_at", { mode: "string", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex("organization_domains_primary_unique").on(table.organizationId).where(sql`${table.isPrimary}`),
]);
