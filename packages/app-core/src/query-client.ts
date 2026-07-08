import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { ApiError } from "./http";

/** Per-mutation hints read by the centralized error handler. */
export type MutationMeta = {
  /** Contextual error toast (e.g. "Failed to update customer"). */
  errorMessage?: string;
  /** Opt out of the centralized toast (the hook shows its own). */
  skipErrorToast?: boolean;
};

export type CreateQueryClientDeps = {
  /** Centralized failure interception (401 redirect + logging). Returns true when handled. */
  reportError: (error: unknown, ctx: { source: "query" | "mutation" }) => boolean;
  /** Human-readable message for an API error, used as the toast fallback. */
  apiErrorMessage: (error: unknown) => string;
  /** Error toast, injected so the package stays free of UI dependencies. */
  showErrorToast: (message: string) => void;
};

/**
 * Build the app QueryClient with centralized error handling: every
 * query/mutation failure flows through `reportError`; mutations additionally
 * get a single error toast, driven by `meta` so hooks stay free of
 * boilerplate. Client errors (4xx) are not retried.
 */
export function createQueryClient({ reportError, apiErrorMessage, showErrorToast }: CreateQueryClientDeps): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: error => reportError(error, { source: "query" }),
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        const handled = reportError(error, { source: "mutation" });
        const meta = mutation.meta as MutationMeta | undefined;
        if (handled || meta?.skipErrorToast) return;
        showErrorToast(meta?.errorMessage ?? apiErrorMessage(error));
      },
    }),
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });
}
