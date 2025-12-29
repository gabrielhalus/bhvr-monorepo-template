import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { Policies } from "../../models/policies.model";
import { PermissionSchema } from "../api/permissions.schemas";

export const PolicySchema = createSelectSchema(Policies).extend({
  effect: z.enum(["allow", "deny"]),
  permission: PermissionSchema.nullable(),
});

