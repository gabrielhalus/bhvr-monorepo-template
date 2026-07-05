const backupRootKey = ["backups"] as const;

export const backupKeys = {
  all: backupRootKey,
  list: [...backupRootKey, "list"] as const,
  localList: [...backupRootKey, "local-list"] as const,
};
