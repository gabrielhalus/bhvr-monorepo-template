import type { RuntimeConfigModel } from "~shared/db/models/runtime-configs.model";

export type ConfigValue = | string | number | boolean | null;

export type RuntimeConfig = typeof RuntimeConfigModel.$inferSelect;

export type ConfigNode = {
  key: string;
  fullKey: string;
  isLeaf: boolean;
  children: Map<string, ConfigNode>;
  config?: any;
};
