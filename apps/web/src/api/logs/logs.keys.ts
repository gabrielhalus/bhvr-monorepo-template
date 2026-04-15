const logsRootKey = ["logs"] as const;

export const logsKeys = {
  all: logsRootKey,
  paginated: [...logsRootKey, "paginated"] as const,
};
