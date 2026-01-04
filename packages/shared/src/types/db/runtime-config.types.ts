import type { config } from "@bunstack/shared/config";
import type { Merge } from "@bunstack/shared/lib/type-utils";
import type { RuntimeConfigModel } from "@bunstack/shared/models/runtime-config.model";

export type ConfigValue = | string | number | boolean | null | ConfigValue[] | { [key: string]: ConfigValue };
export type ConfigDeclaration = typeof config;

export type RuntimeConfig = Merge<typeof RuntimeConfigModel.$inferSelect, { value: ConfigValue }>;
