import type { QueryClient } from "@tanstack/react-query";
import type { Session } from "~shared/types/auth.types";

import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

import { runtimeConfigsQueryOptions } from "~react/queries/runtime-configs";

export type RouterContext = {
  queryClient: QueryClient;
  session: Session | null;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  loader: ({ context }) =>
    context.queryClient.prefetchQuery(runtimeConfigsQueryOptions),
});

function RootLayout() {
  return <Outlet />;
}
