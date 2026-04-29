import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { assertCanView } from "@/lib/auth/trip-permissions";

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
  await assertCanView(tripId, dbUser.id);

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
      <div>
        <p className="app-kicker mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <span className="app-waypoint shrink-0" aria-hidden /> Trip history
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recent role changes, invites, shared costs, and plan updates visible to trip members for context.
        </p>
      </div>

      <section className="app-surface divide-y divide-border rounded-2xl overflow-hidden border border-border/70">
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
                <time className="mt-1 block whitespace-nowrap text-muted-foreground/85" dateTime={row.createdAt.toISOString()}>
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(row.createdAt)}
                </time>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
