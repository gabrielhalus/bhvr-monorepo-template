import { useSuspenseQuery } from "@tanstack/react-query";

import { AuthContext } from "../hooks/use-auth";
import { authQueryOptions } from "../queries/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data } = useSuspenseQuery(authQueryOptions);

  return <AuthContext value={data}>{children}</AuthContext>;
}
