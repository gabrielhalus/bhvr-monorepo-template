/**
 * Returns the initials of a given string.
 * @param input - The string to extract initials from.
 * @param length - Number of initials to return (default 2).
 */
export function generateAvatarFallback(input: string | null, length: number = 2): string {
  if (!input) {
    return "";
  }

  const words = input
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const initials = words
    .map(word => word[0]?.toUpperCase()) // optional chaining ensures safety
    .filter(Boolean) as string[]; // remove possible undefineds

  return initials.slice(0, length).join("");
}
