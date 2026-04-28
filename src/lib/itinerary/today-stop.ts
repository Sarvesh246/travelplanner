import type { StopSerialized } from "@/components/itinerary/types";

function dayFromIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

/**
 * Returns the stop id for “today”: first whose date range contains today,
 * else the earliest future arrival date, else the earliest arrival in the trip.
 */
export function findRelevantStopForToday(stops: StopSerialized[]): string | null {
  if (stops.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);

  for (const stop of stops) {
    const a = dayFromIso(stop.arrivalDate);
    const d = dayFromIso(stop.departureDate);
    if (a && d && today >= a && today <= d) return stop.id;
    if (a && !d && today === a) return stop.id;
  }

  let upcomingBest: StopSerialized | null = null;
  let upcomingDay: string | null = null;
  for (const stop of stops) {
    const a = dayFromIso(stop.arrivalDate);
    if (!a || a < today) continue;
    if (!upcomingDay || a < upcomingDay) {
      upcomingDay = a;
      upcomingBest = stop;
    }
  }
  if (upcomingBest) return upcomingBest.id;

  let earliest: StopSerialized | null = null;
  let earliestDay: string | null = null;
  for (const stop of stops) {
    const a = dayFromIso(stop.arrivalDate);
    if (!a) continue;
    if (!earliestDay || a < earliestDay) {
      earliestDay = a;
      earliest = stop;
    }
  }
  return earliest?.id ?? null;
}
