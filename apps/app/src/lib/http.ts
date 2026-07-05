import type { AppType } from "~api/app";

import { hc } from "hono/client";
import { ENV } from "varlock/env";

const api = hc<AppType>(ENV.VITE_API_URL, {
  init: { credentials: "include" },
});

/**
 * Normalized error thrown by every API call once a response is not `ok`.
 *
 * It preserves the HTTP `status`, the API error `code` (the `error` field of
 * the `{ success: false, error }` envelope) and the request `path`, so the
 * centralized error handlers (query/mutation caches, route error components)
 * can react on facts rather than parsing free-form strings.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly path?: string;

  constructor(status: number, code: string | undefined, message: string, path?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.path = path;
  }

  /** Build an `ApiError` from a failed `Response`, reading its error envelope. */
  static async fromResponse(res: Response): Promise<ApiError> {
    let code: string | undefined;
    try {
      const body = await res.clone().json();
      if (body && typeof body.error === "string") code = body.error;
    } catch {
      // Body is empty or not JSON — fall back to the status text below.
    }

    let path: string | undefined;
    try {
      path = new URL(res.url).pathname;
    } catch {
      // `res.url` may be empty (e.g. in tests); leave the path undefined.
    }

    return new ApiError(res.status, code, code ?? res.statusText ?? "Request failed", path);
  }
}

export { api };
