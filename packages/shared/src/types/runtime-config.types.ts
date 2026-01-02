import type { Merge } from "../lib/type-utils";
import type { RuntimeConfigModel } from "../models/runtime-config.model";

export type ConfigValue = | string | number | boolean | null | ConfigValue[] | { [key: string]: ConfigValue };

export type RuntimeConfig = Merge<typeof RuntimeConfigModel.$inferSelect, { value: ConfigValue }>;
