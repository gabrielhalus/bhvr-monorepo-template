const auditLogsRootKey = ["audit-logs"] as const;

export const auditLogsKeys = {
  all: auditLogsRootKey,
  paginated: [...auditLogsRootKey, "paginated"] as const,
};
