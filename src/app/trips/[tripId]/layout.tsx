import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { TripSidebar } from "@/components/layout/TripSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { TopNav } from "@/components/layout/TopNav";
import { TripProvider } from "@/components/trip/TripContext";

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

  const dbUser = await prisma.user.findUnique({ where: { externalId: user.id } });
  if (!dbUser) redirect("/login");

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      members: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      },
    },
  });

  if (!trip || trip.deletedAt) notFound();

  const membership = trip.members.find((m) => m.userId === dbUser.id);
  if (!membership) redirect("/dashboard");

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
        startDate: trip.startDate?.toISOString() ?? null,
        endDate: trip.endDate?.toISOString() ?? null,
        budgetTarget: trip.budgetTarget ? Number(trip.budgetTarget) : null,
        coverImageUrl: trip.coverImageUrl,
      }}
      currentUser={{ id: dbUser.id, name: dbUser.name, email: dbUser.email, avatarUrl: dbUser.avatarUrl, role: membership.role }}
      members={trip.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        user: m.user,
      }))}
    >
      <div className="min-h-screen flex flex-col bg-background">
        <TopNav user={profile} />
        <div className="flex flex-1 overflow-hidden">
          <TripSidebar tripId={tripId} tripName={trip.name} />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
              {children}
            </div>
          </main>
        </div>
        <MobileNav tripId={tripId} />
      </div>
    </TripProvider>
  );
}
