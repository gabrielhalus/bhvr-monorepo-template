import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

import { InvitationsModel } from "~shared/models/invitations.model";

export const InvitationStatusSchema = z.enum(["pending", "accepted", "expired", "revoked"]);

export const InvitationSchema = createSelectSchema(InvitationsModel).extend({
  status: InvitationStatusSchema,
});

export const InsertInvitationSchema = createInsertSchema(InvitationsModel).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  acceptedAt: true,
  status: true,
}).extend({
  email: z.email().transform(val => val.toLowerCase()),
});

export const UpdateInvitationSchema = createUpdateSchema(InvitationsModel).extend({
  status: InvitationStatusSchema.optional(),
}).partial();
