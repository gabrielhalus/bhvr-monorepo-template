import { describe, expect, it } from "bun:test";

import { generateRandomPassword } from "@/helpers/generate-random-password";

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SPECIAL = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const ALL_VALID = LOWERCASE + UPPERCASE + DIGITS + SPECIAL;

describe("generateRandomPassword", () => {
  it("returns a string of exactly 12 characters", () => {
    const password = generateRandomPassword();
    expect(typeof password).toBe("string");
    expect(password.length).toBe(12);
  });

  it("contains at least one lowercase letter", () => {
    const password = generateRandomPassword();
    expect(password.split("").some(c => LOWERCASE.includes(c))).toBe(true);
  });

  it("contains at least one uppercase letter", () => {
    const password = generateRandomPassword();
    expect(password.split("").some(c => UPPERCASE.includes(c))).toBe(true);
  });

  it("contains at least one digit", () => {
    const password = generateRandomPassword();
    expect(password.split("").some(c => DIGITS.includes(c))).toBe(true);
  });

  it("contains at least one special character", () => {
    const password = generateRandomPassword();
    expect(password.split("").some(c => SPECIAL.includes(c))).toBe(true);
  });

  it("only uses characters from the valid set", () => {
    const password = generateRandomPassword();
    expect(password.split("").every(c => ALL_VALID.includes(c))).toBe(true);
  });

  it("produces different passwords on repeated calls", () => {
    const passwords = new Set(Array.from({ length: 20 }, () => generateRandomPassword()));
    // With 12-char random passwords it's astronomically unlikely to collide
    expect(passwords.size).toBeGreaterThan(1);
  });

  it("always satisfies constraints across many samples", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generateRandomPassword();
      expect(pw.length).toBe(12);
      expect(pw.split("").some(c => LOWERCASE.includes(c))).toBe(true);
      expect(pw.split("").some(c => UPPERCASE.includes(c))).toBe(true);
      expect(pw.split("").some(c => DIGITS.includes(c))).toBe(true);
      expect(pw.split("").some(c => SPECIAL.includes(c))).toBe(true);
    }
  });
});
