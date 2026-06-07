// ~shared/src/schemas/api/ranges.schemas.ts
import { z } from "zod";

export const RANGE_PRESETS = [
  "today",
  "24h",

  "this_week",
  "7d",

  "this_month",
  "30d",
  "90d",

  "this_year",
  "6m",
  "12m",
] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number];

export type DateRangeQuery = {
  range?: RangePreset;
  from?: string;
  to?: string;
};

export type ResolvedDateRange = {
  from: Date;
  to: Date;
  preset?: RangePreset;
};

export const RangeQuerySchema = z.object({
  range: z.enum(RANGE_PRESETS).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
}).refine((data) => {
  if (data.range) {
    return true;
  }

  return !!(data.from && data.to);
}, { message: "Provide either range or from/to", path: ["range"],
}).refine((data) => {
  if (!data.from || !data.to) {
    return true;
  }

  return new Date(data.from) <= new Date(data.to);
}, { message: "`from` must be before `to`", path: ["from"],
});
