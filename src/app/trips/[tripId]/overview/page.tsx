import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { formatCurrency, formatDateRange, daysUntil, tripDuration } from "@/lib/utils";
import { Plane } from "lucide-react";
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
    <div>
      <div className="mb-6 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-start min-[480px]:justify-between min-[480px]:gap-4">
        <h1 className="min-w-0 text-balance text-xl font-bold tracking-tight min-[480px]:text-2xl">
          {trip.name}
        </h1>
        <div className="flex shrink-0 items-center justify-stretch min-[480px]:justify-end">
          <OverviewShareButton />
        </div>
      </div>

      {/* Countdown banner */}
      {days !== null && days >= 0 && (
        <div
          className="relative mb-6 flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm min-[480px]:flex-row min-[480px]:items-center min-[480px]:p-5"
          style={{
            backgroundImage:
              "linear-gradient(90deg, hsl(var(--card)) 0%, hsl(var(--card)) 35%, hsl(var(--secondary) / 0.18) 75%, hsl(var(--secondary) / 0.30) 100%), radial-gradient(ellipse at 78% 110%, hsl(var(--primary) / 0.16), transparent 55%), radial-gradient(circle at 88% 30%, hsl(var(--accent)) 0%, transparent 38%)",
          }}
        >
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Plane className="w-6 h-6 text-primary rotate-45" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {days === 0 ? "Your trip starts" : "Departure in"}
            </p>
            <p className="text-xl font-bold">
              {days === 0 ? "Today! 🎉" : `${days} day${days !== 1 ? "s" : ""}`}
            </p>
            <p className="text-sm text-muted-foreground">{formatDateRange(trip.startDate, trip.endDate)}</p>
          </div>
          {budgetPct !== null && (
            <div className="min-w-0 border-t border-border/60 pt-3 text-left min-[480px]:ml-auto min-[480px]:border-0 min-[480px]:pt-0 min-[480px]:text-right">
              <p className="text-sm text-muted-foreground">Budget used</p>
              <p className="text-xl font-bold">{budgetPct}%</p>
              <p className="break-words text-xs text-muted-foreground">
                {formatCurrency(totalExpenses, trip.currency)} / {formatCurrency(budgetTarget, trip.currency)}
              </p>
            </div>
          )}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">Trip Summary</h2>

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
