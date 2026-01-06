import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { PoliciesModel } from "~shared/db/models/policies.model";
import { PermissionSchema } from "~shared/schemas/api/permissions.schemas";

export const PolicySchema = createSelectSchema(PoliciesModel).extend({
  effect: z.enum(["allow", "deny"]),
  permission: PermissionSchema.nullable(),
});
