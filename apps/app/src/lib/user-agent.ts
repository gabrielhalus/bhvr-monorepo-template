import { Monitor, Smartphone } from "~orbit/components/ui/icons";

// Order matters: Chromium UAs also contain "Safari", and Edge/Opera also contain "Chrome"
const BROWSER_MATCHERS: [RegExp, string][] = [
  [/Edg(?:e|A|iOS)?\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser/, "Samsung Internet"],
  [/Firefox\/|FxiOS/, "Firefox"],
  [/Chrome\/|CriOS/, "Chrome"],
  [/Safari\//, "Safari"],
];

export function parseBrowserName(userAgent: string | null): string | null {
  if (!userAgent) return null;

  for (const [pattern, name] of BROWSER_MATCHERS) {
    if (pattern.test(userAgent)) return name;
  }

  return null;
}

export function parseOsName(userAgent: string | null): string | null {
  if (!userAgent) return null;

  if (/iPhone/i.test(userAgent)) return "iPhone";
  if (/iPad/i.test(userAgent)) return "iPad";
  if (/Android/i.test(userAgent)) return "Android";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Macintosh/i.test(userAgent)) return "Mac";
  if (/Linux/i.test(userAgent)) return "Linux";

  return null;
}

/**
 * Human-readable session device label: "Chrome · Mac", or whichever part is
 * identified; the fallback when neither is.
 */
export function formatDeviceName(userAgent: string | null, fallback: string): string {
  const browser = parseBrowserName(userAgent);
  const os = parseOsName(userAgent);

  if (browser && os) return `${browser} · ${os}`;
  return browser ?? os ?? fallback;
}

export function getDeviceIcon(userAgent: string | null) {
  if (!userAgent) return Monitor;
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) return Smartphone;
  return Monitor;
}
