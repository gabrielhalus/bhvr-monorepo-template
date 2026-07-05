import type { Config } from "~shared/types/db/configs.types";

import { z } from "zod";

import { inferConfigValue } from "~shared/helpers/infer-config-value";

function createSchema(type: "string" | "number" | "boolean" | "list" | "node", nullable: boolean) {
  let schema;

  switch (type) {
    case "string":
      schema = z.string();
      break;
    case "number":
      schema = z.number();
      break;
    case "boolean":
      schema = z.boolean();
      break;
    default:
      schema = z.string();
  }

  return nullable ? schema.nullable() : schema;
}

/** Short mono type chip shown next to a field name (faithful to settings.html `.field-name .tag`). */
export function configTypeTag(config: Config): { label: string; secret?: boolean } {
  if (config.secret) return { label: "secret", secret: true };
  if (config.type === "boolean") return { label: "bool" };
  if (config.type === "image") return { label: "image" };
  if (config.type === "list") return { label: "list" };
  if (config.options) return { label: "enum" };
  if (config.multiline) return { label: "text" };
  if (config.type === "number") return { label: "number" };
  return { label: "string" };
}

/** Empty nullable values become `null` (matches the previous per-field submit logic). */
export function normalizeConfigValue(config: Config, value: string | null): string | null {
  return config.nullable && (value === "" || value === null) ? null : value;
}

/** Whether the (draft) value passes the config's typed schema. */
export function isConfigValueValid(config: Config, value: string | null): boolean {
  if (config.type === "boolean") return true;
  // Image configs are managed through the uploader, not a text input — always valid.
  if (config.type === "image") return true;
  try {
    const normalized = normalizeConfigValue(config, value);
    createSchema(config.type, config.nullable).parse(inferConfigValue(normalized ?? ""));
    return true;
  } catch {
    return false;
  }
}

export function evaluateDisabledCondition(disabledWhen: string | null | undefined, allConfigs: Config[]): boolean {
  if (!disabledWhen) {
    return false;
  }

  const notEqualIndex = disabledWhen.indexOf("!=");
  const equalIndex = disabledWhen.indexOf("=");

  if (equalIndex === -1) {
    return false;
  }

  const isNotEqual = notEqualIndex !== -1 && notEqualIndex < equalIndex;
  const operatorIndex = isNotEqual ? notEqualIndex : equalIndex;
  const operatorLength = isNotEqual ? 2 : 1;

  const configKey = disabledWhen.slice(0, operatorIndex);
  const expectedValue = disabledWhen.slice(operatorIndex + operatorLength);

  const config = allConfigs.find(c => c.configKey === configKey);

  if (!config) {
    return false;
  }

  const actualValue = String(config.value ?? "");
  const isEqual = actualValue === expectedValue;

  return isNotEqual ? !isEqual : isEqual;
}
