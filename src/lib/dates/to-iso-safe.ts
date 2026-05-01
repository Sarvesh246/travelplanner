/** Avoids RangeError from `Invalid Date` (truthy but `toISOString()` throws). */
export function dateToIsoStringOrNull(value: Date | string | null | undefined): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 ? t : null;
  }
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}
