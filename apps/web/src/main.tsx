import "@bunstack/react/styles/globals.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import { Sayno } from "@bunstack/react/components/sayno";
import { Toaster } from "@bunstack/react/components/sonner";
import { queryClient } from "@bunstack/react/lib/query-client";
import { AuthProvider } from "@bunstack/react/providers/auth-provider";
import { ThemeProvider } from "@bunstack/react/providers/theme-provider";
import i18n from "@/i18n";
import { routeTree } from "@/routeTree.gen";

export const router = createRouter({
  routeTree,
  context: { queryClient, session: null },
});

declare module "@tanstack/react-router" {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface Register {
    router: typeof router;
    routeMeta: {
      breadcrumb?: string | ((match: any) => string);
    };
  }
}

async function bootstrap() {
  await i18n.init();

  const rootElement = document.getElementById("root")!;
  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <ThemeProvider>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <RouterProvider router={router} />
              <Toaster position="bottom-center" />
              <Sayno />
            </AuthProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}

bootstrap();
