import { useTranslation } from "react-i18next";

import { ErrorScene, Stamp } from "@/components/route-error";
import { Button } from "~orbit/components/ui/Button";
import { TriangleAlert } from "~orbit/components/ui/icons";

/** Full-screen fallback rendered when the app crashes outside the router. */
export function FatalError() {
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
