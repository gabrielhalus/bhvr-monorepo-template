import { Component } from "react";
import { useTranslation } from "react-i18next";

import { ErrorScene, Stamp } from "@/components/route-error";
import { reportError } from "@/lib/report-error";
import { Button } from "~orbit/components/ui/Button";
import { TriangleAlert } from "~orbit/components/ui/icons";

/** Full-screen fallback rendered when the app crashes outside the router. */
function FatalError() {
  const { t } = useTranslation("web");

  return (
    <div className="grid min-h-dvh place-items-center">
      <ErrorScene
        eyebrow={t("errors.boundary.eyebrow")}
        stamp={<Stamp><TriangleAlert strokeWidth={2.25} /></Stamp>}
        title={t("errors.boundary.title")}
        description={t("errors.boundary.description")}
        actions={(
          <>
            <Button onClick={() => window.location.reload()}>
              {t("errors.boundary.reload")}
            </Button>
            <Button variant="outline" asChild>
              <a href="/">{t("errors.boundary.home")}</a>
            </Button>
          </>
        )}
      />
    </div>
  );
}

/**
 * Last-resort boundary around the whole app. The router has its own
 * `defaultErrorComponent` for route-level failures; this catches everything
 * else (providers, the router shell itself) so a crash never leaves a blank page.
 */
export class AppErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    reportError(error);
  }

  render() {
    return this.state.hasError ? <FatalError /> : this.props.children;
  }
}
