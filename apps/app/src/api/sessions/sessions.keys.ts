const sessionsRootKey = ["sessions"] as const;

export const sessionsKeys = {
  all: sessionsRootKey,
  mine: [...sessionsRootKey, "mine"] as const,
  forUser: (userId: string) => [...sessionsRootKey, "forUser", userId] as const,
};
