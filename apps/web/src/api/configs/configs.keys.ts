const configsRootKey = ["configs"] as const;

export const configsKeys = {
  all: configsRootKey,
  list: [...configsRootKey, "list"] as const,
  byKey: (key: string) => [...configsRootKey, "byKey", key] as const,
};
