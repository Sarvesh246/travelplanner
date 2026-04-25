/** True when the user is on itinerary or a stop detail subpage (for nav highlighting). */
export function isTripItinerarySection(pathname: string, tripId: string): boolean {
  const itinerary = `/trips/${tripId}/itinerary`;
  return pathname === itinerary || pathname.startsWith(`/trips/${tripId}/stops/`);
}
