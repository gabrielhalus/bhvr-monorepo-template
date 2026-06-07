import { customAlphabet } from "nanoid";

type NanoidOptions = {
  size?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
  custom?: string;
};

const ALPHABETS = {
  numbers: "0123456789",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  symbols: "-_",
} as const;

export function nanoid(options: NanoidOptions = {}) {
  const { size = 21, uppercase = true, lowercase = true, numbers = true, symbols = true, custom } = options;

  const alphabet = custom ?? [
    numbers && ALPHABETS.numbers,
    uppercase && ALPHABETS.uppercase,
    lowercase && ALPHABETS.lowercase,
    symbols && ALPHABETS.symbols,
  ].filter(Boolean).join("");

  if (!alphabet.length) throw new Error("nanoid: alphabet must not be empty");

  return customAlphabet(alphabet, size)();
}
