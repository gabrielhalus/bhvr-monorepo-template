import type { DateRangeQuery, ResolvedDateRange } from "~shared/schemas/api/date-range.schemas";

export function resolveRange(query: DateRangeQuery): ResolvedDateRange {
  const now = new Date();

  // ----------------------------
  // Custom range
  // ----------------------------
  if (query.from && query.to) {
    return {
      from: new Date(query.from),
      to: new Date(query.to),
    };
  }

  // ----------------------------
  // Preset
  // ----------------------------
  const range = query.range ?? "7d";

  const to = new Date(now);
  const from = new Date(now);

  switch (range) {
    case "today": {
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      break;
    }

    case "24h": {
      to.setHours(to.getHours() + 24);
      break;
    }

    case "this_week": {
      // Monday = 1, Sunday = 0
      const day = from.getDay();
      const diffFromMonday = day === 0 ? 6 : day - 1;
      const diffToSunday = day === 0 ? 0 : 7 - day;

      from.setDate(from.getDate() - diffFromMonday);
      from.setHours(0, 0, 0, 0);
      to.setDate(to.getDate() + diffToSunday);
      to.setHours(23, 59, 59, 999);
      break;
    }

    case "7d": {
      to.setDate(to.getDate() + 7);
      break;
    }

    case "this_month": {
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      to.setMonth(to.getMonth() + 1, 0);
      to.setHours(23, 59, 59, 999);
      break;
    }

    case "30d": {
      to.setDate(to.getDate() + 30);
      break;
    }

    case "90d": {
      to.setDate(to.getDate() + 90);
      break;
    }

    case "this_year": {
      from.setMonth(0, 1);
      from.setHours(0, 0, 0, 0);
      to.setMonth(11, 31);
      to.setHours(23, 59, 59, 999);
      break;
    }

    case "6m": {
      to.setMonth(to.getMonth() + 6);
      break;
    }

    case "12m": {
      to.setFullYear(to.getFullYear() + 1);
      break;
    }

    default: {
      to.setDate(to.getDate() + 7);
      break;
    }
  }

  return {
    from,
    to,
    preset: query.range,
  };
}
