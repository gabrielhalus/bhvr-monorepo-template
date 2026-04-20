type KnownFormat
  = | "string"
    | "number"
    | "currency"
    | "percent"
    | "date"
    | "time"
    | "datetime"
    | "relative";

type FormatInput = string | undefined;

type FormatterOptions = {
  locale?: string;
  format?: FormatInput;
  currency?: string;
};

const DEFAULT_LOCALE
  = typeof navigator !== "undefined"
    ? navigator.language
    : "en-US";

// ---- caches ----
const numberCache = new Map<string, Intl.NumberFormat>();
const dateCache = new Map<string, Intl.DateTimeFormat>();
const relativeCache = new Map<string, Intl.RelativeTimeFormat>();

// ---- helpers ----
function normalizeFormat(format?: string): KnownFormat {
  switch (format) {
    case "currency":
    case "percent":
    case "date":
    case "time":
    case "datetime":
    case "number":
    case "relative":
      return format;
    default:
      return "string";
  }
}

const MS_PER_UNIT: Record<Intl.RelativeTimeFormatUnit, number> = {
  second: 1_000,
  seconds: 1_000,
  minute: 60_000,
  minutes: 60_000,
  hour: 3_600_000,
  hours: 3_600_000,
  day: 86_400_000,
  days: 86_400_000,
  week: 604_800_000,
  weeks: 604_800_000,
  month: 2_592_000_000,
  months: 2_592_000_000,
  quarter: 7_776_000_000,
  quarters: 7_776_000_000,
  year: 31_536_000_000,
  years: 31_536_000_000,
};

function getRelativeFormatter(locale: string): Intl.RelativeTimeFormat {
  let formatter = relativeCache.get(locale);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    relativeCache.set(locale, formatter);
  }
  return formatter;
}

function formatRelativeAuto(value: Date, locale: string): string {
  const rtf = getRelativeFormatter(locale);
  const diffMs = value.getTime() - Date.now();
  const absDiffMs = Math.abs(diffMs);

  if (absDiffMs < MS_PER_UNIT.minute) return rtf.format(Math.round(diffMs / MS_PER_UNIT.second), "second");
  if (absDiffMs < MS_PER_UNIT.hour) return rtf.format(Math.round(diffMs / MS_PER_UNIT.minute), "minute");
  if (absDiffMs < MS_PER_UNIT.day) return rtf.format(Math.round(diffMs / MS_PER_UNIT.hour), "hour");
  if (absDiffMs < MS_PER_UNIT.week) return rtf.format(Math.round(diffMs / MS_PER_UNIT.day), "day");
  if (absDiffMs < MS_PER_UNIT.month) return rtf.format(Math.round(diffMs / MS_PER_UNIT.week), "week");
  if (absDiffMs < MS_PER_UNIT.year) return rtf.format(Math.round(diffMs / MS_PER_UNIT.month), "month");
  return rtf.format(Math.round(diffMs / MS_PER_UNIT.year), "year");
}

function formatRelativeWithUnit(value: Date, locale: string, unit: Intl.RelativeTimeFormatUnit): string {
  const rtf = getRelativeFormatter(locale);
  const diffMs = value.getTime() - Date.now();
  return rtf.format(Math.round(diffMs / MS_PER_UNIT[unit]), unit);
}

// Parses "relativetime(quarter)" → "quarter"
function parseRelativetimeUnit(format: string): Intl.RelativeTimeFormatUnit | null {
  const match = /^relativetime\((\w+)\)$/.exec(format);
  return match ? (match[1] as Intl.RelativeTimeFormatUnit) : null;
}

function resolveLocale(locale?: string): string {
  return locale ?? DEFAULT_LOCALE;
}

// ---- public API ----
export function formatValue(value: unknown, options: FormatterOptions = {}): string {
  if (value === null || value === undefined) return "—";

  const locale = resolveLocale(options.locale);
  const rawFormat = options.format;
  const format = normalizeFormat(rawFormat);

  // ---- Date ----
  if (value instanceof Date) {
    if (rawFormat === "relative") return formatRelativeAuto(value, locale);

    if (rawFormat) {
      const unit = parseRelativetimeUnit(rawFormat);
      if (unit) return formatRelativeWithUnit(value, locale, unit);
    }

    const kind = format === "string" ? "datetime" : format;
    const key = `${locale}:${kind}`;

    let formatter = dateCache.get(key);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat(locale, {
        dateStyle: kind !== "time" ? "medium" : undefined,
        timeStyle: kind !== "date" ? "short" : undefined,
      });
      dateCache.set(key, formatter);
    }

    return formatter.format(value);
  }

  // ---- Number ----
  if (typeof value === "number") {
    if (format === "currency") {
      const currency = options.currency ?? "USD";
      const key = `${locale}:currency:${currency}`;

      let formatter = numberCache.get(key);
      if (!formatter) {
        formatter = new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
        });
        numberCache.set(key, formatter);
      }

      return formatter.format(value);
    }

    if (format === "percent") {
      const key = `${locale}:percent`;

      let formatter = numberCache.get(key);
      if (!formatter) {
        formatter = new Intl.NumberFormat(locale, {
          style: "percent",
        });
        numberCache.set(key, formatter);
      }

      return formatter.format(value);
    }

    const key = `${locale}:number`;
    let formatter = numberCache.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat(locale);
      numberCache.set(key, formatter);
    }

    return formatter.format(value);
  }

  // ---- Boolean ----
  if (typeof value === "boolean") {
    return value ? "✓" : "—";
  }

  // ---- String / fallback ----
  return String(value);
}
