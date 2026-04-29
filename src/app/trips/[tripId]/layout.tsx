import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { TripSidebar } from "@/components/layout/TripSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { TopNav } from "@/components/layout/TopNav";
import { TripShellClient } from "@/components/layout/TripShellClient";
import { TripProvider } from "@/components/trip/TripContext";
import { ViewerReadOnlyBanner } from "@/components/trip/ViewerReadOnlyBanner";
import { TripSwipeHint } from "@/components/layout/TripSwipeHint";
import { getTripLayoutData } from "@/lib/trip-layout-data";

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.toISOString();
}

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getTripLayoutData(tripId, user.id);
  if (data.ok === false) {
    if (data.reason === "no_user") redirect("/login");
    if (data.reason === "not_found") notFound();
    redirect("/dashboard");
  }

  const { dbUser, trip, membership } = data;

  const profile = {
    name: dbUser.name,
    email: dbUser.email,
    avatarUrl: dbUser.avatarUrl,
  };

  return (
    <TripProvider
      trip={{
        id: trip.id,
        name: trip.name,
        currency: trip.currency,
        status: trip.status,
        startDate: toIsoString(trip.startDate),
        endDate: toIsoString(trip.endDate),
        budgetTarget: trip.budgetTarget ? Number(trip.budgetTarget) : null,
        estimatedCostOverride: trip.estimatedCostOverride ? Number(trip.estimatedCostOverride) : null,
        coverImageUrl: trip.coverImageUrl,
      }}
      currentUser={{ id: dbUser.id, name: dbUser.name, email: dbUser.email, avatarUrl: dbUser.avatarUrl, role: membership.role }}
      members={trip.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: typeof m.joinedAt === "string" ? m.joinedAt : m.joinedAt.toISOString(),
        user: m.user,
      }))}
    >
      <div className="app-workspace-shell flex min-h-dvh flex-col bg-background">
        <TopNav
          user={profile}
          trip={{ id: trip.id, name: trip.name, canManage: ["OWNER", "ADMIN"].includes(membership.role) }}
        />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <TripSidebar tripId={tripId} tripName={trip.name} />
          <main
            data-trip-main-scroll=""
            className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
          >
            <TripShellClient tripId={tripId}>
              <div className="mx-auto max-w-[72rem] px-3 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] pt-4 min-[400px]:px-4 min-[400px]:pt-5 sm:px-6 sm:pt-6 md:pb-6">
                <TripSwipeHint />
                <ViewerReadOnlyBanner />
                {children}
              </div>
            </TripShellClient>
          </main>
        </div>
        <MobileNav tripId={tripId} />
      </div>
    </TripProvider>
  );
}
