export type ConfigValue = string | number | boolean | null;

export type Config = {
  configKey: string;
  value: string | null;
  defaultValue: string | null;
  isOverridden: boolean;
  type: "string" | "number" | "boolean" | "list" | "node" | "image";
  nullable: boolean;
  multiline: boolean;
  secret: boolean;
  rotatable: boolean;
  options: string | null;
  disabledWhen: string | null;
  order: number;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type ConfigNode = {
  key: string;
  fullKey: string;
  isLeaf: boolean;
  order?: number;
  children: Map<string, ConfigNode>;
  config?: Config;
};
