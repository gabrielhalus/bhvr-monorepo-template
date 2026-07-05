/**
 * Format first and last name into a full name string
 *
 * @param firstName - The user's first name
 * @param lastName - The user's last name
 * @returns The formatted full name
 *
 * @example
 * formatFullName("John", "Doe")
 * // Returns: "John Doe"
 *
 * formatFullName("Jane", "")
 * // Returns: "Jane"
 */
export function formatFullName(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}
