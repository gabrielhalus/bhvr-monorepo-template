import type { PermissionSchema, PlatformPermissionSchema } from "~shared/schemas/api/permissions.schemas";
import type { z } from "zod";

export type Permission = z.infer<typeof PermissionSchema>;

export type PlatformPermission = z.infer<typeof PlatformPermissionSchema>;
