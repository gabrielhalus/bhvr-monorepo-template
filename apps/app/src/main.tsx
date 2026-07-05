import "@/styles.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import { AppErrorBoundary } from "@/components/app-error-boundary";
import { NotFound, RouteError } from "@/components/route-error";
import { Sayno } from "@/components/sayno";
import { Toaster } from "@/components/toaster";
import i18n from "@/i18n";
import { queryClient } from "@/lib/query-client";
import { setErrorTranslator } from "@/lib/report-error";
import { AuthProvider } from "@/providers/auth-provider";
import { BrandingProvider } from "@/providers/branding-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { routeTree } from "@/routeTree.gen";

export const router = createRouter({
  routeTree,
  context: { queryClient, session: null },
  // Centralized boundaries: loader throws and render errors land on a
  // recoverable screen instead of crashing the app to a blank page.
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: NotFound,
  // Orbit's AppShell scrolls inside AppShellMain (the nav rail stays put). Router
  // restores that column via its data-scroll-restoration-id="main" — reset on
  // navigation, restore on back/forward.
  scrollRestoration: true,
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

  // Let the centralized error handlers (mutation toasts, boundaries) localize.
  setErrorTranslator(key => i18n.t(key));

  const rootElement = document.getElementById("root")!;
  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <ThemeProvider>
        <I18nextProvider i18n={i18n}>
          <AppErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <BrandingProvider>
                <AuthProvider>
                  <RouterProvider router={router} />
                  <Toaster position="bottom-right" />
                  <Sayno />
                </AuthProvider>
              </BrandingProvider>
            </QueryClientProvider>
          </AppErrorBoundary>
        </I18nextProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}

bootstrap();
