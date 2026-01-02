import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { PoliciesModel } from "@bunstack/shared/models/policies.model";
import { PermissionSchema } from "@bunstack/shared/schemas/api/permissions.schemas";

export const PolicySchema = createSelectSchema(PoliciesModel).extend({
  effect: z.enum(["allow", "deny"]),
  permission: PermissionSchema.nullable(),
});
