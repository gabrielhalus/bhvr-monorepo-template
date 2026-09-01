import type { Context } from "hono";

import { clientIp } from "@/lib/trusted-proxy";

export function getClientInfo(c: Context) {
  return {
    ip: clientIp(c),
    userAgent: c.req.header("user-agent") ?? "",
  };
}
