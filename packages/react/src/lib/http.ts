import type { AppType } from "~api/app";

import { hc } from "hono/client";
import { ENV } from "varlock/env";

const api = hc<AppType>(ENV.VITE_API_URL, {
  init: { credentials: "include" },
});

export { api };
