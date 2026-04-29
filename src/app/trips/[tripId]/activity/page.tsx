import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { assertCanView } from "@/lib/auth/trip-permissions";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClearActivityButton } from "@/components/activity/ClearActivityButton";
import { LocalDateTime } from "@/components/shared/LocalDateTime";

export const metadata = { title: "Activity" };

export default async function TripActivityPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { externalId: user.id } });
  if (!dbUser) redirect("/login");
  const membership = await assertCanView(tripId, dbUser.id);

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true },
  });
  if (!trip) notFound();

  const logs = await prisma.auditLog.findMany({
    where: { tripId },
    orderBy: { createdAt: "desc" },
    take: 120,
    select: {
      id: true,
      action: true,
      summary: true,
      createdAt: true,
      actorUserId: true,
    },
  });

  const actorIds = [...new Set(logs.map((l) => l.actorUserId).filter(Boolean))] as string[];
  const actors =
    actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true },
        })
      : [];
  const actorName = Object.fromEntries(actors.map((a) => [a.id, a.name]));

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Trip history"
        title="Activity"
        description="Recent role changes, invites, shared costs, and plan updates visible to trip members for context."
        actions={
          ["OWNER", "ADMIN"].includes(membership.role) ? (
            <ClearActivityButton tripId={tripId} />
          ) : undefined
        }
      />

      <section className="app-surface max-w-5xl divide-y divide-border rounded-2xl overflow-hidden border border-border/70">
        {logs.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
          </div>
        ) : (
          logs.map((row) => (
            <div key={row.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 min-[460px]:px-6">
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug text-foreground">{row.summary || row.action}</p>
                <p className="mt-1 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">{row.action}</p>
              </div>
              <div className="text-right shrink-0 text-xs leading-tight">
                <p className="text-muted-foreground">
                  {(row.actorUserId ? actorName[row.actorUserId] ?? "Member" : "System")}
                </p>
                <LocalDateTime
                  className="mt-1 block whitespace-nowrap text-muted-foreground/85"
                  value={row.createdAt}
                />
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
