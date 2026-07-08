import { toast } from "sonner";

import { ApiError, createQueryClient } from "~app-core/index";

export const queryClient = createQueryClient({
  reportError: (error) => {
    if (error instanceof ApiError && error.status === 401 && window.location.pathname !== "/login") {
      window.location.assign(`/login?redirect=${encodeURIComponent(window.location.href)}`);
      return true;
    }
    return false;
  },
  apiErrorMessage: error => error instanceof ApiError ? error.message : "Something went wrong",
  showErrorToast: message => toast.error(message),
});
