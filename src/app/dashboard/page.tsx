import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Plane } from "lucide-react";
import { TripCard } from "@/components/trip/TripCard";
import { DashboardTripSortSelect } from "@/components/dashboard/DashboardTripSortSelect";
import { parseDashboardTripSort, sortDashboardMemberships } from "@/lib/dashboard-trip-sort";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string | string[] }>;
}) {
  const params = await searchParams;
  const sortRaw = params.sort;
  const sort = parseDashboardTripSort(
    Array.isArray(sortRaw) ? sortRaw[0] : sortRaw
  );
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
          _count: { select: { stops: { where: { deletedAt: null } } } },
          stops: {
            where: {
              deletedAt: null,
              latitude: { not: null },
              longitude: { not: null },
            },
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { latitude: true, longitude: true },
          },
        },
      },
    },
    orderBy: { trip: { updatedAt: "desc" } },
  });

  const trips = memberships
    .map((m) => m.trip)
    .filter((t) => !t.deletedAt);

  const visibleMemberships = memberships.filter((m) => !m.trip.deletedAt);
  const sortedMemberships = sortDashboardMemberships(visibleMemberships, sort);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Your Trips</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {trips.length === 0 ? "Plan your first adventure" : `${trips.length} trip${trips.length !== 1 ? "s" : ""} planned`}
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:ml-auto sm:w-auto sm:shrink-0 sm:flex-row sm:items-center sm:justify-end sm:gap-3 lg:gap-4">
          {trips.length > 0 ? (
            <Suspense
              fallback={
                <div
                  className="h-9 w-full min-w-0 rounded-lg border border-border bg-muted/30 sm:min-w-[16.5rem] sm:max-w-none animate-pulse"
                  aria-hidden
                />
              }
            >
              <DashboardTripSortSelect />
            </Suspense>
          ) : null}
          <Link
            href="/trips/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-end bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm sm:self-center"
          >
            <Plus className="w-4 h-4" />
            New Trip
          </Link>
        </div>
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
          {sortedMemberships.map((m, index) => {
            const trip = m.trip;
            const geo = trip.stops[0];
            const mapPreview =
              geo && geo.latitude != null && geo.longitude != null
                ? { lat: Number(geo.latitude), lon: Number(geo.longitude) }
                : null;
            return (
            <TripCard
              key={trip.id}
              trip={{
                id: trip.id,
                name: trip.name,
                description: trip.description,
                coverImageUrl: trip.coverImageUrl,
                startDate: trip.startDate?.toISOString() ?? null,
                endDate: trip.endDate?.toISOString() ?? null,
                status: trip.status,
              }}
              memberCount={trip.members.length}
              members={trip.members.map((mem) => mem.user)}
              stopCount={trip._count.stops}
              mapPreview={mapPreview}
              canEditCover={m.role === "OWNER" || m.role === "ADMIN"}
              canEditStatus={m.role === "OWNER" || m.role === "ADMIN"}
              canDelete={m.role === "OWNER"}
              coverImagePriority={index < 3}
            />
            );
          })}
        </div>
      )}
    </div>
  );
}
