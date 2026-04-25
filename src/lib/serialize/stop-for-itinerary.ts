import type { Prisma } from "@prisma/client";
import type { StopSerialized } from "@/components/itinerary/types";

export const itineraryStopInclude = {
  stays: {
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  },
  activities: {
    where: { deletedAt: null },
    orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }],
  },
} satisfies Prisma.StopInclude;

export type StopWithItineraryDetails = Prisma.StopGetPayload<{ include: typeof itineraryStopInclude }>;

export function serializeItineraryStop(s: StopWithItineraryDetails): StopSerialized {
  return {
    id: s.id,
    name: s.name,
    country: s.country,
    description: s.description,
    latitude: s.latitude == null ? null : Number(s.latitude),
    longitude: s.longitude == null ? null : Number(s.longitude),
    placeId: s.placeId,
    sortOrder: s.sortOrder,
    arrivalDate: s.arrivalDate?.toISOString() ?? null,
    departureDate: s.departureDate?.toISOString() ?? null,
    status: s.status,
    stays: s.stays.map((st) => ({
      id: st.id,
      name: st.name,
      address: st.address,
      url: st.url,
      checkIn: st.checkIn?.toISOString() ?? null,
      checkOut: st.checkOut?.toISOString() ?? null,
      pricePerNight: st.pricePerNight ? Number(st.pricePerNight) : null,
      totalPrice: st.totalPrice ? Number(st.totalPrice) : null,
      status: st.status,
      notes: st.notes,
      confirmationNo: st.confirmationNo,
    })),
    activities: s.activities.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      scheduledDate: a.scheduledDate?.toISOString() ?? null,
      scheduledTime: a.scheduledTime,
      durationMins: a.durationMins,
      estimatedCost: a.estimatedCost ? Number(a.estimatedCost) : null,
      actualCost: a.actualCost ? Number(a.actualCost) : null,
      status: a.status,
      url: a.url,
      sortOrder: a.sortOrder,
    })),
  };
}
