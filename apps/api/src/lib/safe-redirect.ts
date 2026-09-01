/** Longest redirect path accepted; anything beyond is treated as hostile. */
const MAX_REDIRECT_LENGTH = 512;

/**
 * Reduce a caller-supplied redirect to a same-origin absolute path, falling
 * back to `/` for anything else.
 *
 * This guards every `Location` we build from user input. Rejecting `\` matters
 * as much as rejecting `//`: the URL parser normalizes backslashes to slashes
 * for special schemes, so a relative `Location` of `/\evil.com` resolves to the
 * scheme-relative `//evil.com` and leaves the site.
 *
 * @param raw - The redirect target received from the caller
 * @returns A path safe to use as a relative `Location`
 */
export function sanitizeRedirect(raw: string | undefined): string {
  if (!raw || raw.length > MAX_REDIRECT_LENGTH) {
    return "/";
  }

  // Reject scheme-relative (`//host`) and backslash-relative (`/\host`) paths.
  if (!/^\/(?![/\\])/.test(raw) || raw.includes("\\")) {
    return "/";
  }

  // Reject control characters: a CR/LF reaching the Location header would let
  // a caller inject response headers.
  for (const char of raw) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7F) {
      return "/";
    }
  }

  return raw;
}
