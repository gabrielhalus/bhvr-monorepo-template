import type { Session } from "@bunstack/shared/types/auth.types";

import { createContext, use } from "react";

export const AuthContext = createContext<Session | null>(null);

export function useAuth(): Session {
  const ctx = use(AuthContext);
  if (!ctx)
    throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
