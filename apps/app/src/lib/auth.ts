import { createAuth } from "~app-core/index";

import { authQueryOptions } from "../queries/auth";
import { queryClient } from "./query-client";

export const auth = createAuth({ queryClient, authQueryOptions });
