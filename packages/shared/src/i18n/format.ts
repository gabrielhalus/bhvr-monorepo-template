type KnownFormat
  = | "string"
    | "number"
    | "currency"
    | "percent"
    | "date"
    | "time"
    | "datetime";

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

// ---- helpers ----
function normalizeFormat(format?: string): KnownFormat {
  switch (format) {
    case "currency":
    case "percent":
    case "date":
    case "time":
    case "datetime":
    case "number":
      return format;
    default:
      return "string";
  }
}

function resolveLocale(locale?: string): string {
  return locale ?? DEFAULT_LOCALE;
}

// ---- public API ----
export function formatValue(value: unknown, options: FormatterOptions = {}): string {
  if (value === null || value === undefined)
    return "—";

  const locale = resolveLocale(options.locale);
  const format = normalizeFormat(options.format);

  // ---- Date ----
  if (value instanceof Date) {
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
