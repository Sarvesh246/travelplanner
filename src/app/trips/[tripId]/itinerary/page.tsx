import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ItineraryClient } from "@/components/itinerary/ItineraryClient";

export const metadata = { title: "Itinerary" };

export default async function ItineraryPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stops = await prisma.stop.findMany({
    where: { tripId, deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: {
      stays: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
      },
      activities: {
        where: { deletedAt: null },
        orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }],
      },
    },
  });

  const serialized = stops.map((s) => ({
    id: s.id,
    name: s.name,
    country: s.country,
    description: s.description,
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
  }));

  return <ItineraryClient tripId={tripId} stops={serialized} />;
}
