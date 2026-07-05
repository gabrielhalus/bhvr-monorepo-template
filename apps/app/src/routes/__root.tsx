import type { QueryClient } from "@tanstack/react-query";
import type { Session } from "~shared/types/auth.types";

import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export type RouterContext = {
  queryClient: QueryClient;
  session: Session | null;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return <Outlet />;
}
