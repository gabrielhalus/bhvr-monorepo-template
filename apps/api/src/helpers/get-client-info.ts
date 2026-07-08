import type { OrgContext } from "@/middlewares/org-context";
import type { Context } from "hono";

/**
 * Client info spread into audit log contexts. Includes the resolved
 * organization so every log written with `...getClientInfo(c)` is stamped
 * with the org it happened under (null = platform surface).
 */
export function getClientInfo(c: Context) {
  const raw = c.req.raw;
  const forwardedFor = raw.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? "::1";
  const userAgent = raw.headers.get("user-agent") ?? "";
  const organizationId = (c.get("orgContext") as OrgContext)?.org.id ?? null;

  return { ip, userAgent, organizationId };
}
