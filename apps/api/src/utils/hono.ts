import type { UserWithRelations } from "~shared/types/db/users.types";
import type { Context } from "hono";

import { createFactory } from "hono/factory";

export type AppEnv = {
  Variables: {
    sessionContext: {
      user: UserWithRelations<["roles"]>;
      impersonator?: UserWithRelations<["roles"]>;
    };
  };
};

export const factory = createFactory<AppEnv>();

export type AppContext = Context<AppEnv, string, object>;
