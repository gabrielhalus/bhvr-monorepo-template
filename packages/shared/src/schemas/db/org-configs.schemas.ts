import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { OrgConfigsModel } from "~shared/models/org-configs.model";

export const OrgConfigSchema = createSelectSchema(OrgConfigsModel);

export const InsertOrgConfigSchema = createInsertSchema(OrgConfigsModel).omit({ updatedAt: true });
