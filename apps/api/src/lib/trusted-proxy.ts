import type { Context } from "hono";

import { getConnInfo } from "hono/bun";
import { ENV } from "varlock/env";

/**
 * Number of reverse proxies between the internet and this process.
 *
 * Every proxy appends the address it saw to `X-Forwarded-For`, so the real
 * client address is the `hops`-th entry counted from the *right*. Everything
 * further left was supplied by the client and must never be trusted: reading
 * the leftmost entry lets anyone rotate a header value to bypass rate limiting
 * and to forge the IP recorded in the audit log.
 *
 * Defaults to 1 — the bundled compose puts exactly one nginx in front of the
 * API. Set 0 when the API is exposed directly, or raise it for an extra edge
 * proxy (Traefik/Caddy in front of the app container).
 */
const HOPS = Math.max(0, ENV.TRUSTED_PROXY_HOPS ?? 1);

/**
 * The address of the client that opened the connection.
 *
 * @param c - The Hono context object
 * @returns The client IP, or "unknown" when it cannot be determined
 */
export function clientIp(c: Context): string {
  if (HOPS > 0) {
    const chain = (c.req.header("x-forwarded-for") ?? "")
      .split(",")
      .map(entry => entry.trim())
      .filter(Boolean);

    const trusted = chain[chain.length - HOPS];
    if (trusted) {
      return trusted;
    }
  }

  return socketAddress(c) ?? "unknown";
}

/**
 * The origin the browser actually used to reach this request.
 *
 * `X-Forwarded-*` are only honoured when a trusted proxy sits in front, since
 * a client can set them freely. Without a proxy the request URL is used, which
 * a client cannot forge beyond its own `Host` header — callers that embed the
 * result in something durable (an email link) must still pin it, see the
 * `app.publicOrigin` runtime config.
 *
 * @param c - The Hono context object
 * @returns An absolute origin with no trailing slash, e.g. `https://example.com`
 */
export function publicOrigin(c: Context): string {
  const url = new URL(c.req.url);

  if (HOPS > 0) {
    const host = firstHeaderValue(c.req.header("x-forwarded-host")) ?? c.req.header("host");
    const proto = firstHeaderValue(c.req.header("x-forwarded-proto"));

    if (host && isPlausibleHost(host)) {
      return `${proto ?? url.protocol.replace(":", "")}://${host}`;
    }
  }

  return `${url.protocol}//${url.host}`;
}

/** Whether the request reached the browser over TLS. */
export function isSecureRequest(c: Context): boolean {
  return publicOrigin(c).startsWith("https://");
}

/**
 * A proxy that is fed several hops worth of headers may send a comma-separated
 * list; only the first entry describes the original client.
 */
function firstHeaderValue(raw: string | undefined): string | undefined {
  return raw?.split(",")[0]?.trim() || undefined;
}

/**
 * Reject anything that is not a bare `host[:port]` before interpolating it into
 * an origin — a header carrying a path, a scheme or CRLF must not be able to
 * reshape the URLs we build from it.
 */
function isPlausibleHost(host: string): boolean {
  return /^[a-z0-9.\-[\]:]+$/i.test(host) && host.length <= 253;
}

/** The peer address of the TCP connection, when the runtime exposes it. */
function socketAddress(c: Context): string | undefined {
  try {
    return getConnInfo(c).remote.address;
  } catch {
    // No Bun server in scope (unit tests drive the app through app.request).
    return undefined;
  }
}
