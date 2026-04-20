const apiKeysRootKey = ["api-keys"] as const;

export const apiKeysKeys = {
  forUser: (userId: string) => [...apiKeysRootKey, "forUser", userId] as const,
};
