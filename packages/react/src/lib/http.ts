import type { AppType } from "~api/app";

import { hc } from "hono/client";

import { env } from "./env";

const api = hc<AppType>(env.VITE_API_URL, {
  init: { credentials: "include" },
});

export { api };
