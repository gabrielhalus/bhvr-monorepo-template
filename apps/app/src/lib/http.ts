import type { AppType } from "~api/app";

import { ENV } from "varlock/env";

import { ApiError, createApiClient } from "~app-core/index";

const api = createApiClient<AppType>(ENV.VITE_API_URL);

export { api, ApiError };
