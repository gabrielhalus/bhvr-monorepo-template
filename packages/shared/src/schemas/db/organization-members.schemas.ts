import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { OrganizationMembersModel } from "~shared/models/organization-members.model";

export const OrganizationMemberSchema = createSelectSchema(OrganizationMembersModel);

export const InsertOrganizationMemberSchema = createInsertSchema(OrganizationMembersModel).omit({ createdAt: true });
