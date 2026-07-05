import type { ErrorComponentProps } from "@tanstack/react-router";

import { Link, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/lib/http";
import { Button } from "~orbit/components/ui/Button";
import { Clock, RefreshCw, TriangleAlert } from "~orbit/components/ui/icons";

const RISE = "motion-safe:animate-[error-rise_0.5s_ease-out_both]";

/**
 * Shared stage for the error and not-found boundaries: a dotted backdrop, a
 * soft accent halo and a staggered entrance keep the failure on-brand and a
 * little playful instead of a dead end. Stays inside the content area so the
 * dashboard chrome survives.
 */
export function ErrorScene({ eyebrow, stamp, title, description, actions }: {
  eyebrow: React.ReactNode;
  stamp: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <div
      data-slot="route-error"
      className="relative isolate flex min-h-[60vh] flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16"
    >
      {/* Dotted grid, faded toward the edges. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle,var(--color-line)_1px,transparent_1.5px)] bg-size-[24px_24px] opacity-60 mask-[radial-gradient(ellipse_55%_50%_at_50%_42%,black,transparent)]"
      />
      {/* Accent glow behind the stamp. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[34%] -z-10 size-72 -translate-1/2 rounded-full bg-accent/25 opacity-70 blur-3xl motion-safe:animate-[error-halo_3.5s_ease-in-out_infinite]"
      />

      <div className={`mb-9 ${RISE}`}>{stamp}</div>

      <div className="flex max-w-md flex-col items-center gap-2.5 text-center">
        <span className={`${RISE} text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-deep [animation-delay:60ms]`}>
          {eyebrow}
        </span>
        <h1 className={`${RISE} text-2xl font-semibold tracking-tight text-ink [animation-delay:120ms]`}>
          {title}
        </h1>
        <p className={`${RISE} text-sm/relaxed text-muted [animation-delay:180ms]`}>
          {description}
        </p>
        <div className={`${RISE} mt-4 flex items-center gap-2 [animation-delay:260ms]`}>{actions}</div>
      </div>
    </div>
  );
}

/** Accent "stamp" badge that lazily bobs and tilts like a sticker. */
export function Stamp({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative motion-safe:animate-[error-bob_5s_ease-in-out_infinite]">
      <div aria-hidden className="absolute inset-0 rounded-[1.75rem] bg-accent opacity-50 blur-xl" />
      <div className="relative grid size-24 place-items-center rounded-[1.75rem] bg-accent text-white shadow-pop [&_svg]:size-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Router-level error boundary. Catches thrown loader errors **and** render
 * errors for every route, so an uncaught {@link ApiError} or React crash shows
 * a recoverable screen instead of a blank page.
 */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const { t } = useTranslation("web");
  const router = useRouter();

  function retry() {
    reset();
    void router.invalidate();
  }

  // A 429 can happen even before sign-in (it blocks the session request), so
  // give it its own recoverable screen instead of the generic crash message.
  if (error instanceof ApiError && error.status === 429) {
    return (
      <ErrorScene
        eyebrow={t("errors.rateLimited.eyebrow")}
        stamp={<Stamp><Clock strokeWidth={2.25} /></Stamp>}
        title={t("errors.rateLimited.title")}
        description={t("errors.rateLimited.description")}
        actions={(
          <Button onClick={retry}>
            <RefreshCw className="size-4" />
            {t("errors.rateLimited.retry")}
          </Button>
        )}
      />
    );
  }

  const detail = error instanceof ApiError
    ? `${error.status} · ${error.message}`
    : error instanceof Error
      ? error.message
      : undefined;

  return (
    <ErrorScene
      eyebrow={t("errors.boundary.eyebrow")}
      stamp={<Stamp><TriangleAlert strokeWidth={2.25} /></Stamp>}
      title={t("errors.boundary.title")}
      description={(
        <>
          {t("errors.boundary.description")}
          {detail && (
            <span className="mt-3 block w-fit max-w-full self-center truncate rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-xs text-muted">
              {detail}
            </span>
          )}
        </>
      )}
      actions={(
        <>
          <Button onClick={retry}>
            <RefreshCw className="size-4" />
            {t("errors.boundary.retry")}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">{t("errors.boundary.home")}</Link>
          </Button>
        </>
      )}
    />
  );
}

/** Router-level not-found boundary for unmatched routes. */
export function NotFound() {
  const { t } = useTranslation("web");

  return (
    <ErrorScene
      eyebrow={t("errors.notFound.eyebrow")}
      stamp={(
        <span className="block select-none bg-linear-to-b from-accent to-accent-deep bg-clip-text text-[7.5rem] font-black leading-none tracking-tighter text-transparent motion-safe:animate-[error-bob_5s_ease-in-out_infinite]">
          404
        </span>
      )}
      title={t("errors.notFound.title")}
      description={t("errors.notFound.description")}
      actions={(
        <Button asChild>
          <Link to="/">{t("errors.notFound.home")}</Link>
        </Button>
      )}
    />
  );
}
