import { parseDateKey } from "@/lib/dates/date-key";

/** Tiny caption for itinerary rows, e.g. `Outlook · Tue May 6`. Prefer arrival night when provided. */
export function stopForecastTimingCaption(arrivalDate: string | null, departureDate: string | null): string | null {
  const slice = arrivalDate?.slice(0, 10) || departureDate?.slice(0, 10);
  if (!slice || !/^\d{4}-\d{2}-\d{2}$/.test(slice)) return null;
  const parsed = parseDateKey(slice);
  if (!parsed) return null;

  const d = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  if (Number.isNaN(d.getTime())) return null;

  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(d);
  const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(d);
  const seg = `${weekday} ${monthDay}`;

  return arrivalDate ? `Arrive · ${seg}` : `Outlook · ${seg}`;
}
