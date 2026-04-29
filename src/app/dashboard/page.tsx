import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Clock3, Compass, Plus, Route } from "lucide-react";
import { TripCard } from "@/components/trip/TripCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { DashboardTripSortSelect } from "@/components/dashboard/DashboardTripSortSelect";
import { parseDashboardTripSort, sortDashboardMemberships } from "@/lib/dashboard-trip-sort";
import { formatDate } from "@/lib/utils";
import { ensureAppUserForAuth } from "@/lib/auth/ensure-app-user";

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

  const dbUser = await ensureAppUserForAuth(user);

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const planningCount = sortedMemberships.filter((m) =>
    ["DRAFT", "PLANNING", "IN_PROGRESS"].includes(m.trip.status)
  ).length;
  const upcomingMembership = sortedMemberships.find((m) => {
    if (!m.trip.startDate) return false;
    const start = new Date(m.trip.startDate);
    start.setHours(0, 0, 0, 0);
    return start >= today;
  });
  const recentlyUpdated = sortedMemberships[0]?.trip.updatedAt ?? null;

  return (
    <div>
      <section className="app-page-band app-surface mb-6">
        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex flex-col gap-4 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between">
            <div className="min-w-0">
              <p className="app-kicker mb-2">
                <span className="app-waypoint" aria-hidden />
                Trip hub
              </p>
              <h1 className="text-2xl font-bold tracking-tight">Your Trips</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {trips.length === 0 ? "Start a route and bring the crew into one plan." : `${trips.length} trip${trips.length !== 1 ? "s" : ""} in your workspace`}
              </p>
            </div>
            <div className="flex w-full min-w-0 flex-wrap items-center gap-3 min-[520px]:w-auto min-[520px]:shrink-0 min-[520px]:justify-end">
              {trips.length > 0 ? (
                <Suspense
                  fallback={
                    <div
                      className="h-9 min-w-[12.5rem] max-w-full flex-1 min-[480px]:flex-none min-[480px]:w-44 rounded-lg border border-border bg-muted/30 animate-pulse"
                      aria-hidden
                    />
                  }
                >
                  <DashboardTripSortSelect />
                </Suspense>
              ) : null}
              <Link
                href="/trips/new"
                className="app-hover-lift inline-flex shrink-0 items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Trip
              </Link>
            </div>
          </div>

          {trips.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              <DashboardSignal icon={<Route className="h-4 w-4" />} label="Active planning" value={planningCount.toString()} />
              <DashboardSignal
                icon={<CalendarDays className="h-4 w-4" />}
                label="Next departure"
                value={upcomingMembership?.trip.startDate ? formatDate(upcomingMembership.trip.startDate, { month: "short", day: "numeric" }) : "TBD"}
              />
              <DashboardSignal
                icon={<Clock3 className="h-4 w-4" />}
                label="Last updated"
                value={recentlyUpdated ? formatDate(recentlyUpdated, { month: "short", day: "numeric" }) : "No activity"}
              />
            </div>
          )}
        </div>
      </section>

      {trips.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-8 h-8" />}
          title="No trips yet"
          description="Create your first trip and invite your crew into one shared plan."
          action={
            <Link
              href="/trips/new"
              className="app-hover-lift flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first trip
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Active planning</h2>
              <p className="text-sm text-muted-foreground">Open a trip to work the route, pack list, costs, and crew decisions.</p>
            </div>
            <div className="hidden h-px flex-1 bg-gradient-to-r from-border to-transparent sm:block" aria-hidden />
          </div>
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
        </div>
      )}
    </div>
  );
}

function DashboardSignal({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="app-glass flex min-w-0 items-center gap-3 rounded-xl px-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
