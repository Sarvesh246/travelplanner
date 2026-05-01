import { reportServerError } from "@/lib/observability/errors";
import { isValidDateKeyLocal, toDateKeyUtcDate } from "@/lib/dates/date-key";

export interface CalendarMathProvider {
  validateDate(dateKey: string): Promise<boolean>;
  daysUntil(dateKey: string): Promise<number>;
  weekday(dateKey: string): Promise<number>;
  weekNumber(dateKey: string): Promise<number>;
  isLeapYear(year: number): Promise<boolean>;
}

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const DIGIDATES_BASE_URL = "https://digidates.de/api/v1";
const REQUEST_TIMEOUT_MS = 1_500;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const cache = new Map<string, CacheEntry<unknown>>();

function cacheKey(method: string, value: string | number) {
  return `${method}:${value}`;
}

function readCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function writeCache<T>(key: string, value: T, ttlMs: number): T {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

type JsonContext = Record<string, string | number | boolean | null>;

async function reportCalendarFallback(source: string, error: unknown, context: JsonContext) {
  await reportServerError({
    source,
    error,
    context,
  });
}

async function fetchJson<T>(path: string, source: string, context: JsonContext): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${DIGIDATES_BASE_URL}${path}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`DigiDates responded with HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    await reportCalendarFallback(source, error, context);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackValidateDate(dateKey: string): boolean {
  return isValidDateKeyLocal(dateKey);
}

function fallbackDaysUntil(dateKey: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetUtc = toDateKeyUtcDate(dateKey);
  const target = new Date(
    targetUtc.getUTCFullYear(),
    targetUtc.getUTCMonth(),
    targetUtc.getUTCDate()
  );
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function fallbackWeekday(dateKey: string): number {
  return toDateKeyUtcDate(dateKey).getUTCDay();
}

function fallbackWeekNumber(dateKey: string): number {
  const date = toDateKeyUtcDate(dateKey);
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  return 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

function fallbackIsLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function assertYear(year: number): number {
  if (!Number.isInteger(year) || year < 1) {
    throw new Error("Year must be a positive integer");
  }
  return year;
}

export const digidatesCalendarProvider: CalendarMathProvider = {
  async validateDate(dateKey) {
    const key = cacheKey("checkdate", dateKey);
    const cached = readCache<boolean>(key);
    if (cached != null) return cached;

    if (!isValidDateKeyLocal(dateKey)) {
      return writeCache(key, false, ONE_DAY_MS);
    }

    try {
      const payload = await fetchJson<boolean>(
        `/checkdate?date=${encodeURIComponent(dateKey)}`,
        "calendar.digidates.validateDate",
        { dateKey }
      );
      if (typeof payload !== "boolean") {
        await reportCalendarFallback(
          "calendar.digidates.validateDate",
          new Error("Unexpected DigiDates checkdate payload"),
          { dateKey }
        );
        throw new Error("Unexpected DigiDates checkdate payload");
      }
      return writeCache(key, payload, ONE_DAY_MS);
    } catch {
      return writeCache(key, fallbackValidateDate(dateKey), ONE_DAY_MS);
    }
  },

  async daysUntil(dateKey) {
    const key = cacheKey("countdown", dateKey);
    const cached = readCache<number>(key);
    if (cached != null) return cached;

    try {
      const payload = await fetchJson<{ daysonly?: unknown }>(
        `/countdown/${encodeURIComponent(dateKey)}`,
        "calendar.digidates.daysUntil",
        { dateKey }
      );
      if (typeof payload.daysonly !== "number") {
        await reportCalendarFallback(
          "calendar.digidates.daysUntil",
          new Error("Unexpected DigiDates countdown payload"),
          { dateKey }
        );
        throw new Error("Unexpected DigiDates countdown payload");
      }
      return writeCache(key, payload.daysonly, ONE_HOUR_MS);
    } catch {
      return writeCache(key, fallbackDaysUntil(dateKey), ONE_HOUR_MS);
    }
  },

  async weekday(dateKey) {
    const key = cacheKey("weekday", dateKey);
    const cached = readCache<number>(key);
    if (cached != null) return cached;

    try {
      const payload = await fetchJson<unknown>(
        `/weekday?date=${encodeURIComponent(dateKey)}`,
        "calendar.digidates.weekday",
        { dateKey }
      );
      if (typeof payload !== "number") {
        await reportCalendarFallback(
          "calendar.digidates.weekday",
          new Error("Unexpected DigiDates weekday payload"),
          { dateKey }
        );
        throw new Error("Unexpected DigiDates weekday payload");
      }
      return writeCache(key, payload, ONE_DAY_MS);
    } catch {
      return writeCache(key, fallbackWeekday(dateKey), ONE_DAY_MS);
    }
  },

  async weekNumber(dateKey) {
    const key = cacheKey("week", dateKey);
    const cached = readCache<number>(key);
    if (cached != null) return cached;

    try {
      const payload = await fetchJson<unknown>(
        `/week?date=${encodeURIComponent(dateKey)}`,
        "calendar.digidates.weekNumber",
        { dateKey }
      );
      if (typeof payload !== "number") {
        await reportCalendarFallback(
          "calendar.digidates.weekNumber",
          new Error("Unexpected DigiDates week payload"),
          { dateKey }
        );
        throw new Error("Unexpected DigiDates week payload");
      }
      return writeCache(key, payload, ONE_DAY_MS);
    } catch {
      return writeCache(key, fallbackWeekNumber(dateKey), ONE_DAY_MS);
    }
  },

  async isLeapYear(year) {
    const normalizedYear = assertYear(year);
    const key = cacheKey("leapyear", normalizedYear);
    const cached = readCache<boolean>(key);
    if (cached != null) return cached;

    try {
      const payload = await fetchJson<unknown>(
        `/leapyear?year=${normalizedYear}`,
        "calendar.digidates.isLeapYear",
        { year: normalizedYear }
      );
      if (typeof payload !== "boolean") {
        await reportCalendarFallback(
          "calendar.digidates.isLeapYear",
          new Error("Unexpected DigiDates leapyear payload"),
          { year: normalizedYear }
        );
        throw new Error("Unexpected DigiDates leapyear payload");
      }
      return writeCache(key, payload, ONE_DAY_MS);
    } catch {
      return writeCache(key, fallbackIsLeapYear(normalizedYear), ONE_DAY_MS);
    }
  },
};
