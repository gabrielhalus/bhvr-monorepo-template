const runtimeConfigsRootKey = ["runtime-configs"] as const;

export const runtimeConfigsKeys = {
  all: runtimeConfigsRootKey,
  list: [...runtimeConfigsRootKey, "list"] as const,
  byKey: (key: string) => [...runtimeConfigsRootKey, "byKey", key] as const,
};
