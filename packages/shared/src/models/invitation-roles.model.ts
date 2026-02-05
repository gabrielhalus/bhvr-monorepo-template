import { integer, pgTable, primaryKey, varchar } from "drizzle-orm/pg-core";

import { InvitationsModel } from "~shared/models/invitations.model";
import { RolesModel } from "~shared/models/roles.model";

export const InvitationRolesModel = pgTable("invitation_roles", {
  invitationId: varchar("invitation_id", { length: 21 }).notNull().references(() => InvitationsModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  roleId: integer("role_id").notNull().references(() => RolesModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
}, t => [primaryKey({ columns: [t.invitationId, t.roleId] })]);
