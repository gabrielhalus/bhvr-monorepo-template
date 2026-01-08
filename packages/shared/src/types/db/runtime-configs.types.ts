import type { RuntimeConfigModel } from "~shared/db/models/runtime-configs.model";
import type { Merge } from "~shared/lib/type-utils";

export type ConfigValue = | string | number | boolean | null;

export type RuntimeConfig = Merge<typeof RuntimeConfigModel.$inferSelect, { value: ConfigValue }>;

export type ConfigNode = {
  key: string;
  fullKey: string;
  isLeaf: boolean;
  children: Map<string, ConfigNode>;
  config?: any;
};
