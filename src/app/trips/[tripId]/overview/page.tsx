import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { formatCurrency, formatDateRange, daysUntil, tripDuration } from "@/lib/utils";
import { CalendarDays, Plane, WalletCards } from "lucide-react";
import { OverviewClient } from "@/components/overview/OverviewClient";
import { OverviewShareButton } from "@/components/overview/OverviewShareButton";

export const metadata = { title: "Overview" };

export default async function OverviewPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { externalId: user.id } });
  if (!dbUser) redirect("/login");

  const [trip, memberCount, stopCount, supplyStats, expenseStats, openVoteCount] =
    await Promise.all([
      prisma.trip.findUnique({ where: { id: tripId } }),
      prisma.tripMember.count({ where: { tripId, status: "ACTIVE" } }),
      prisma.stop.count({ where: { tripId, deletedAt: null } }),
      prisma.supplyItem.aggregate({
        where: { tripId, deletedAt: null },
        _count: { id: true },
        _sum: { estimatedCost: true, actualCost: true },
      }),
      prisma.expense.aggregate({
        where: { tripId, deletedAt: null },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      prisma.vote.count({ where: { tripId, status: "OPEN" } }),
    ]);

  if (!trip || trip.deletedAt) notFound();

  const days = daysUntil(trip.startDate);
  const duration = tripDuration(trip.startDate, trip.endDate);
  const totalExpenses = Number(expenseStats._sum.totalAmount ?? 0);
  const budgetTarget = Number(trip.budgetTarget ?? 0);
  const budgetPct = budgetTarget > 0 ? Math.min(100, Math.round((totalExpenses / budgetTarget) * 100)) : null;
  const coveredItems = await prisma.supplyItem.count({ where: { tripId, status: { in: ["COVERED"] }, deletedAt: null } });
  const totalItems = supplyStats._count.id;

  return (
    <div className="space-y-5">
      <section className="app-page-band app-surface">
        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between">
            <div className="min-w-0">
              <p className="app-kicker mb-2">
                <span className="app-waypoint" aria-hidden />
                Trip overview
              </p>
              <h1 className="min-w-0 text-balance text-2xl font-bold tracking-tight">
                {trip.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDateRange(trip.startDate, trip.endDate)}
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-stretch min-[520px]:justify-end">
              <OverviewShareButton />
            </div>
          </div>

          <div className="grid gap-3 min-[560px]:grid-cols-2">
            <div className="app-glass flex items-center gap-3 rounded-xl px-3 py-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Plane className="w-5 h-5 rotate-45" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {days === 0 ? "Departure" : "Departure window"}
                </p>
                <p className="truncate text-base font-semibold">
                  {days === null ? "Dates TBD" : days < 0 ? "Completed" : days === 0 ? "Today" : `${days} day${days !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>

            {budgetPct !== null ? (
              <div className="app-glass flex items-center gap-3 rounded-xl px-3 py-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <WalletCards className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Budget used</p>
                    <p className="text-sm font-semibold">{budgetPct}%</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${budgetPct}%` }} />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {formatCurrency(totalExpenses, trip.currency)} / {formatCurrency(budgetTarget, trip.currency)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="app-glass flex items-center gap-3 rounded-xl px-3 py-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Route length</p>
                  <p className="truncate text-base font-semibold">{duration ? `${duration} day${duration !== 1 ? "s" : ""}` : "Build the route"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold">Trip summary</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" aria-hidden />
      </div>

      <OverviewClient
        stats={{
          memberCount,
          stopCount,
          duration,
          totalExpenses,
          currency: trip.currency,
          budgetTarget,
          budgetPct,
          totalItems,
          coveredItems,
          openVoteCount,
          expenseCount: expenseStats._count.id,
        }}
        tripId={tripId}
      />
    </div>
  );
}
