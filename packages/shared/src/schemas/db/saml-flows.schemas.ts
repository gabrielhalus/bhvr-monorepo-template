import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { SamlFlowsModel } from "~shared/models/saml-flows.model";

export const SamlFlowSchema = createSelectSchema(SamlFlowsModel);
export const InsertSamlFlowSchema = createInsertSchema(SamlFlowsModel);
