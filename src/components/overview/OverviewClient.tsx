"use client";

import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import { StatCard } from "./StatCard";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import {
  Users, Map, Clock, Receipt, Package, Vote, CheckCircle2, TrendingUp
} from "lucide-react";
import { useTripContext } from "@/components/trip/TripContext";

interface OverviewClientProps {
  stats: {
    memberCount: number;
    stopCount: number;
    duration: number | null;
    totalExpenses: number;
    currency: string;
    budgetTarget: number;
    budgetPct: number | null;
    totalItems: number;
    coveredItems: number;
    openVoteCount: number;
    expenseCount: number;
  };
  tripId: string;
}

export function OverviewClient({ stats, tripId }: OverviewClientProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid gap-4 grid-cols-2 sm:grid-cols-3"
    >
      <StatCard
        label="Members"
        value={stats.memberCount}
        icon={<Users className="w-5 h-5" />}
        iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        href={ROUTES.tripMembers(tripId)}
      />
      <StatCard
        label="Stops"
        value={stats.stopCount}
        icon={<Map className="w-5 h-5" />}
        iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        href={ROUTES.tripItinerary(tripId)}
      />
      {stats.duration && (
        <StatCard
          label="Days"
          value={stats.duration}
          icon={<Clock className="w-5 h-5" />}
          iconColor="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
        />
      )}
      <StatCard
        label="Total Expenses"
        value={formatCurrency(stats.totalExpenses, stats.currency)}
        icon={<Receipt className="w-5 h-5" />}
        iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        href={ROUTES.tripExpenses(tripId)}
      />
      <StatCard
        label="Items Packed"
        value={`${stats.coveredItems}/${stats.totalItems}`}
        icon={<Package className="w-5 h-5" />}
        iconColor="bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
        href={ROUTES.tripSupplies(tripId)}
      />
      <StatCard
        label="Open Votes"
        value={stats.openVoteCount}
        icon={<Vote className="w-5 h-5" />}
        iconColor="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
        href={ROUTES.tripVotes(tripId)}
      />
    </motion.div>
  );
}
