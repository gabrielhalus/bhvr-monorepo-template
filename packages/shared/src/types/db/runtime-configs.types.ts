import type { config } from "~shared/config";
import type { RuntimeConfigModel } from "~shared/db/models/runtime-configs.model";
import type { Merge } from "~shared/lib/type-utils";

export type ConfigValue = | string | number | boolean | null | ConfigValue[] | { [key: string]: ConfigValue };
export type ConfigDeclaration = typeof config;

export type RuntimeConfig = Merge<typeof RuntimeConfigModel.$inferSelect, { value: ConfigValue }>;
