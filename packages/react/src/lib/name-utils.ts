/**
 * Capitalize the first letter of a string
 */
function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Parse and format a full name string
 * Splits into first and last name, trims, lowercases, then title-cases for display
 *
 * @param fullName - The full name string (e.g., "john doe")
 * @returns Object with formatted firstName, lastName, and fullName
 *
 * @example
 * parseUserName("john doe")
 * // Returns: { firstName: "John", lastName: "Doe", fullName: "John Doe" }
 *
 * parseUserName("  jane   smith  ")
 * // Returns: { firstName: "Jane", lastName: "Smith", fullName: "Jane Smith" }
 */
export function parseUserName(fullName: string) {
  const trimmed = fullName.trim().toLowerCase();
  const parts = trimmed.split(/\s+/).filter(Boolean);

  const firstName = capitalize(parts[0] || "");
  const lastName = capitalize(parts.slice(1).join(" "));

  return {
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" "),
  };
}
