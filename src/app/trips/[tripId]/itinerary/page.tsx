import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ItineraryClient } from "@/components/itinerary/ItineraryClient";
import { itineraryStopInclude, serializeItineraryStop } from "@/lib/serialize/stop-for-itinerary";

export const metadata = { title: "Itinerary" };

export default async function ItineraryPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stops = await prisma.stop.findMany({
    where: { tripId, deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: itineraryStopInclude,
  });

  const serialized = stops.map(serializeItineraryStop);

  return <ItineraryClient tripId={tripId} stops={serialized} />;
}
