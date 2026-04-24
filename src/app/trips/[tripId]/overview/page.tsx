import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { formatCurrency, formatDateRange, daysUntil, tripDuration } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { StatCard } from "@/components/overview/StatCard";
import {
  Users, Map, Package, Receipt, Vote, Clock, Calendar,
  CheckCircle2, AlertCircle, TrendingUp, Plane,
} from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import { OverviewClient } from "@/components/overview/OverviewClient";

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
      {/* Countdown banner */}
      {days !== null && days >= 0 && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Plane className="w-6 h-6 text-primary rotate-45" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {days === 0 ? "Your trip starts" : "Departure in"}
            </p>
            <p className="text-xl font-bold">
              {days === 0 ? "Today! 🎉" : `${days} day${days !== 1 ? "s" : ""}`}
            </p>
            <p className="text-sm text-muted-foreground">{formatDateRange(trip.startDate, trip.endDate)}</p>
          </div>
          {budgetPct !== null && (
            <div className="ml-auto text-right">
              <p className="text-sm text-muted-foreground">Budget used</p>
              <p className="text-xl font-bold">{budgetPct}%</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(totalExpenses, trip.currency)} / {formatCurrency(budgetTarget, trip.currency)}</p>
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
