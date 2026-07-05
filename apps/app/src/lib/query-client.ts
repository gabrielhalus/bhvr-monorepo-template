import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "./http";
import { apiErrorMessage, reportError } from "./report-error";

/** Per-mutation hints read by the centralized error handler. */
type MutationMeta = {
  /** Contextual error toast (e.g. "Failed to update customer"). */
  errorMessage?: string;
  /** Opt out of the centralized toast (the hook shows its own). */
  skipErrorToast?: boolean;
};

declare module "@tanstack/react-query" {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface Register {
    mutationMeta: MutationMeta;
  }
}

export const queryClient = new QueryClient({
  // Centralized interception: every query/mutation failure flows through
  // `reportError` (401 redirect + logging). Mutations additionally get a single
  // error toast here, driven by `meta` so hooks stay free of boilerplate.
  queryCache: new QueryCache({
    onError: error => reportError(error, { source: "query" }),
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      const handled = reportError(error, { source: "mutation" });
      const meta = mutation.meta;
      if (handled || meta?.skipErrorToast) return;
      toast.error(meta?.errorMessage ?? apiErrorMessage(error));
    },
  }),
  defaultOptions: {
    queries: {
      // Client errors (4xx) are deterministic — retrying only delays the
      // failure. Keep retries for transient/network/5xx issues only.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});
