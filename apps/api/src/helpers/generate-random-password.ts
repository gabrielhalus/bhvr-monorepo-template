/**
 * Generates a random password that meets the password requirements.
 * @returns A random password string.
 */
export function generateRandomPassword(): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const getRandomChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  // Ensure at least one of each required character type
  const requiredChars = [
    getRandomChar(lowercase),
    getRandomChar(uppercase),
    getRandomChar(digits),
    getRandomChar(special),
  ];

  // Fill the rest with random characters from all types
  const allChars = lowercase + uppercase + digits + special;
  const remainingLength = 12 - requiredChars.length;

  for (let i = 0; i < remainingLength; i++) {
    requiredChars.push(getRandomChar(allChars));
  }

  // Shuffle the array
  for (let i = requiredChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [requiredChars[i], requiredChars[j]] = [requiredChars[j], requiredChars[i]];
  }

  return requiredChars.join("");
}
