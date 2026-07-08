import type { MutationMeta } from "~app-core/index";

import { toast } from "sonner";

import { createQueryClient } from "~app-core/index";

import { apiErrorMessage, reportError } from "./report-error";

declare module "@tanstack/react-query" {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface Register {
    mutationMeta: MutationMeta;
  }
}

export const queryClient = createQueryClient({
  reportError: (error, ctx) => reportError(error, ctx),
  apiErrorMessage,
  showErrorToast: message => toast.error(message),
});
