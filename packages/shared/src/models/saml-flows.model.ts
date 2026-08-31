import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { nanoid } from "~shared/lib/nanoid";

/**
 * A SAML authentication request awaiting its assertion.
 *
 * The IdP answers with a cross-site POST to the ACS, on which the browser
 * withholds `SameSite=Lax` cookies — so the flow state cannot live in a cookie
 * the way the OAuth one does. It is keyed by the `ID` of the AuthnRequest,
 * which the IdP echoes back in `InResponseTo`; that same row therefore doubles
 * as the replay guard, since consuming it makes a second use of the assertion
 * fail.
 */
export const SamlFlowsModel = pgTable("saml_flows", {
  id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
  requestId: varchar("request_id", { length: 128 }).notNull().unique(),
  mode: varchar("mode", { length: 16 }).notNull(),
  redirectTo: text("redirect_to").notNull(),
  linkToken: varchar("link_token", { length: 64 }),
  expiresAt: timestamp("expires_at", { mode: "string", withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { mode: "string", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("idx_saml_flows_expires_at").on(table.expiresAt),
]);
