import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { CalendarDays, Plane, WalletCards } from "lucide-react";
import { OverviewClient } from "@/components/overview/OverviewClient";
import { OverviewShareButton } from "@/components/overview/OverviewShareButton";
import { OverviewHeroEditor } from "@/components/overview/OverviewHeroEditor";
import { OverviewQuickAdds } from "@/components/overview/OverviewQuickAdds";
import { OverviewDuplicateButton } from "@/components/overview/OverviewDuplicateButton";
import { OverviewContextHints } from "@/components/overview/OverviewContextHints";
import { computeEstimatedTripCost } from "@/lib/trip-metrics";
import {
  daysUntilPlanningDate,
  tripDurationFromPlanningDates,
} from "@/lib/calendar/planning-dates";

export const metadata = { title: "Overview" };

export default async function OverviewPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { externalId: user.id } });
  if (!dbUser) redirect("/login");

  const [trip, memberCount, stopCount, supplyItems, expenseStats, openVoteCount, recentStops, recentSupplies, recentExpenses] =
    await Promise.all([
      prisma.trip.findUnique({ where: { id: tripId } }),
      prisma.tripMember.count({ where: { tripId, status: "ACTIVE" } }),
      prisma.stop.count({ where: { tripId, deletedAt: null } }),
      prisma.supplyItem.findMany({
        where: { tripId, deletedAt: null },
        select: { status: true, estimatedCost: true, actualCost: true, quantityNeeded: true },
      }),
      prisma.expense.aggregate({
        where: { tripId, deletedAt: null },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      prisma.vote.count({ where: { tripId, status: "OPEN" } }),
      prisma.stop.findMany({
        where: { tripId, deletedAt: null },
        select: { id: true, name: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
      prisma.supplyItem.findMany({
        where: { tripId, deletedAt: null },
        select: { id: true, name: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
      prisma.expense.findMany({
        where: { tripId, deletedAt: null },
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
    ]);

  if (!trip || trip.deletedAt) notFound();

  const days = await daysUntilPlanningDate(trip.startDate);
  const duration = tripDurationFromPlanningDates(trip.startDate, trip.endDate);
  const totalExpenses = Number(expenseStats._sum.totalAmount ?? 0);
  const supplyCosts = supplyItems.map((item) => ({
    ...item,
    estimatedCost: item.estimatedCost != null ? Number(item.estimatedCost) : null,
    actualCost: item.actualCost != null ? Number(item.actualCost) : null,
  }));
  const { automaticCost: automaticTripCost, estimatedCost: estimatedTripCost } =
    computeEstimatedTripCost({
      totalExpenses,
      supplyItems: supplyCosts,
      estimatedCostOverride:
        trip.estimatedCostOverride != null
          ? Number(trip.estimatedCostOverride)
          : null,
    });
  const splitMemberCount = Math.max(1, trip.costSplitMemberCountOverride ?? memberCount ?? 1);
  const individualTripCost = estimatedTripCost / splitMemberCount;
  const budgetTarget = Number(trip.budgetTarget ?? 0);
  const budgetPct = budgetTarget > 0 ? Math.min(100, Math.round((estimatedTripCost / budgetTarget) * 100)) : null;
  const coveredItems = supplyItems.filter((item) => item.status === "COVERED").length;
  const totalItems = supplyItems.length;
  const recentActivity = [
    ...recentStops.map((s) => ({ id: s.id, label: `Stop updated: ${s.name}`, at: s.updatedAt.toISOString(), kind: "stop" as const })),
    ...recentSupplies.map((s) => ({ id: s.id, label: `Supply updated: ${s.name}`, at: s.updatedAt.toISOString(), kind: "supply" as const })),
    ...recentExpenses.map((e) => ({ id: e.id, label: `Expense updated: ${e.title}`, at: e.updatedAt.toISOString(), kind: "expense" as const })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 8);

  return (
    <div className="space-y-5">
      <section className="app-page-band app-surface">
        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between">
            <div className="min-w-0 flex-1">
              <p className="app-kicker mb-3">
                <span className="app-waypoint" aria-hidden />
                Trip overview
              </p>
              <OverviewHeroEditor
                tripId={tripId}
                name={trip.name}
                startDate={trip.startDate ? trip.startDate.toISOString().slice(0, 10) : null}
                endDate={trip.endDate ? trip.endDate.toISOString().slice(0, 10) : null}
                estimatedCost={estimatedTripCost}
                automaticCost={automaticTripCost}
                individualCost={individualTripCost}
                actualMemberCount={memberCount}
                splitMemberCount={splitMemberCount}
                hasManualEstimate={trip.estimatedCostOverride !== null}
                currency={trip.currency}
              />
            </div>
            <div className="flex shrink-0 flex-col gap-3 items-stretch min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-end">
              <OverviewDuplicateButton tripId={tripId} />
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
                    {formatCurrency(estimatedTripCost, trip.currency)} / {formatCurrency(budgetTarget, trip.currency)}
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

      <OverviewContextHints tripId={tripId} />

      <OverviewQuickAdds tripId={tripId} />

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
        recentActivity={recentActivity}
        tripId={tripId}
      />
    </div>
  );
}
