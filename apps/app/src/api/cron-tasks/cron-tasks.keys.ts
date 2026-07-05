const cronTasksRootKey = ["cron-tasks"] as const;

export const cronTasksKeys = {
  all: cronTasksRootKey,
  paginated: [...cronTasksRootKey, "paginated"] as const,
  stats: [...cronTasksRootKey, "stats"] as const,
  byId: (taskId: string) => ["cron-tasks", "byId", taskId] as const,
  runs: (taskId: string) => ["cron-tasks", taskId, "runs"] as const,
  runsPaginated: (taskId: string) => ["cron-tasks", taskId, "runs", "paginated"] as const,
  runsRecent: (taskId: string) => ["cron-tasks", taskId, "runs", "recent"] as const,
  runsChart: (taskId: string) => ["cron-tasks", taskId, "runs", "chart"] as const,
  runStats: (taskId: string) => ["cron-tasks", taskId, "stats"] as const,
};
