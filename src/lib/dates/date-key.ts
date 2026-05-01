export const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: string): boolean {
  return DATE_KEY_PATTERN.test(value);
}

export function parseDateKey(dateKey: string) {
  if (!isDateKey(dateKey)) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

export function isValidDateKeyLocal(dateKey: string): boolean {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return false;

  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  return (
    date.getUTCFullYear() === parsed.year &&
    date.getUTCMonth() === parsed.month - 1 &&
    date.getUTCDate() === parsed.day
  );
}

export function dateKeyFromDateLike(value: Date | string | null | undefined): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    if (isDateKey(value)) return value;
    const slice = value.slice(0, 10);
    if (isDateKey(slice)) return slice;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  if (
    parsed.getUTCHours() === 0 &&
    parsed.getUTCMinutes() === 0 &&
    parsed.getUTCSeconds() === 0 &&
    parsed.getUTCMilliseconds() === 0
  ) {
    return [
      parsed.getUTCFullYear(),
      `${parsed.getUTCMonth() + 1}`.padStart(2, "0"),
      `${parsed.getUTCDate()}`.padStart(2, "0"),
    ].join("-");
  }

  return [
    parsed.getFullYear(),
    `${parsed.getMonth() + 1}`.padStart(2, "0"),
    `${parsed.getDate()}`.padStart(2, "0"),
  ].join("-");
}

export function toDateKeyUtcDate(dateKey: string): Date {
  const parsed = parseDateKey(dateKey);
  if (!parsed || !isValidDateKeyLocal(dateKey)) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }

  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
}

export function compareDateKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

export function dateKeyDiffInDays(startDateKey: string, endDateKey: string): number {
  const start = toDateKeyUtcDate(startDateKey).getTime();
  const end = toDateKeyUtcDate(endDateKey).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

export function tripDurationFromDateKeys(
  startDateKey: string | null | undefined,
  endDateKey: string | null | undefined
): number | null {
  if (!startDateKey || !endDateKey) return null;
  return dateKeyDiffInDays(startDateKey, endDateKey) + 1;
}

export function todayDateKey(now = new Date()): string {
  return [
    now.getFullYear(),
    `${now.getMonth() + 1}`.padStart(2, "0"),
    `${now.getDate()}`.padStart(2, "0"),
  ].join("-");
}

export function dateKeyInRange(dateKey: string, startDateKey: string, endDateKey: string): boolean {
  return compareDateKeys(dateKey, startDateKey) >= 0 && compareDateKeys(dateKey, endDateKey) <= 0;
}
