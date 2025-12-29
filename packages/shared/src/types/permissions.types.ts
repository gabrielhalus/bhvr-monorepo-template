import type { PermissionSchema } from "../schemas/permissions.schemas";
import type { z } from "zod";

export type Permission = z.infer<typeof PermissionSchema>;
