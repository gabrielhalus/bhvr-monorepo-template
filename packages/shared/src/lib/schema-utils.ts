import { z } from "zod";

export const trimmed = z.string().transform(val => val.trim());
export const uppercased = trimmed.transform(val => val.toUpperCase());
export const capitalized = trimmed.transform(val =>
  val.replace(/\b\w/g, c => c.toUpperCase()),
);

export const optionalString = z.string()
  .nullish()
  .transform(val => val?.trim() || null);
