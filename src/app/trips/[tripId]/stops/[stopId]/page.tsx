import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { StopDetailView } from "@/components/itinerary/StopDetailView";
import { itineraryStopInclude, serializeItineraryStop } from "@/lib/serialize/stop-for-itinerary";

type Props = { params: Promise<{ tripId: string; stopId: string }> };

export async function generateMetadata({ params }: Props) {
  const { tripId, stopId } = await params;
  const stop = await prisma.stop.findFirst({
    where: { id: stopId, tripId },
    select: { name: true, deletedAt: true },
  });
  if (!stop || stop.deletedAt) return { title: "Stop" };
  return { title: stop.name };
}

export default async function TripStopPage({ params }: Props) {
  const { tripId, stopId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { externalId: user.id } });
  if (!dbUser) redirect("/login");

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: dbUser.id, status: "ACTIVE" },
  });
  if (!member) redirect("/dashboard");

  const stop = await prisma.stop.findFirst({
    where: { id: stopId, tripId, deletedAt: null },
    include: itineraryStopInclude,
  });
  if (!stop) notFound();

  const serialized = serializeItineraryStop(stop);

  return <StopDetailView stop={serialized} tripId={tripId} layout="page" />;
}
