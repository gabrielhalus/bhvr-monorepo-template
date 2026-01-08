import type { ConfigValue } from "~shared/types/db/runtime-configs.types";

import { getDefaultConfigValue } from "~shared/helpers/get-default-config-value";
import { getRuntimeConfig } from "~shared/queries/runtime-configs.queries";

export async function getRuntimeConfigValue<T extends ConfigValue>(key: string): Promise<T> {
  const dbConfig = await getRuntimeConfig(key);

  if (dbConfig) {
    return dbConfig.value as T;
  }

  const defaultValue = getDefaultConfigValue(key);
  if (defaultValue === undefined) {
    throw new Error(`Configuration key "${key}" not found`);
  }

  return defaultValue as T;
}
