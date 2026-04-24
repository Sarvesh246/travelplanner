import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Plane } from "lucide-react";
import { TripCard } from "@/components/trip/TripCard";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let dbUser = await prisma.user.findUnique({
    where: { externalId: user.id },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        externalId: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email?.split("@")[0] || "Traveler",
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
    });
  }

  const memberships = await prisma.tripMember.findMany({
    where: { userId: dbUser.id, status: "ACTIVE" },
    include: {
      trip: {
        include: {
          members: {
            where: { status: "ACTIVE" },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            take: 5,
          },
          stops: { where: { deletedAt: null }, select: { id: true } },
        },
      },
    },
    orderBy: { trip: { updatedAt: "desc" } },
  });

  const trips = memberships
    .map((m) => m.trip)
    .filter((t) => !t.deletedAt);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Your Trips</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {trips.length === 0 ? "Plan your first adventure" : `${trips.length} trip${trips.length !== 1 ? "s" : ""} planned`}
          </p>
        </div>
        <Link
          href="/trips/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Plane className="w-10 h-10 text-primary rotate-45" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No trips yet</h2>
          <p className="text-muted-foreground mb-8 max-w-sm text-sm">
            Create your first trip and invite your crew. Plan together, stress less.
          </p>
          <Link
            href="/trips/new"
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first trip
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              memberCount={trip.members.length}
              members={trip.members.map((m) => m.user)}
              stopCount={trip.stops.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}
