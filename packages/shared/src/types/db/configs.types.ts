import type { ConfigModel } from "~shared/models/configs.model";

export type ConfigValue = | string | number | boolean | null;

export type Config = typeof ConfigModel.$inferSelect;

export type ConfigNode = {
  key: string;
  fullKey: string;
  isLeaf: boolean;
  order?: number;
  children: Map<string, ConfigNode>;
  config?: any;
};
