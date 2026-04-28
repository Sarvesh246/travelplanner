"use client";

import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import { StatCard } from "./StatCard";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import {
  Users, Map, Clock, Receipt, Package, Vote
} from "lucide-react";
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
      className="grid grid-cols-1 gap-3 min-[384px]:grid-cols-2 min-[384px]:gap-4 sm:grid-cols-3"
    >
      <StatCard
        label="Members"
        value={stats.memberCount}
        icon={<Users className="w-5 h-5" />}
        iconColor="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] dark:bg-[hsl(var(--primary)/0.15)] dark:text-[hsl(var(--primary))]"
        href={ROUTES.tripMembers(tripId)}
      />
      <StatCard
        label="Stops"
        value={stats.stopCount}
        icon={<Map className="w-5 h-5" />}
        iconColor="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] dark:bg-[hsl(var(--primary)/0.15)] dark:text-[hsl(var(--primary))]"
        href={ROUTES.tripItinerary(tripId)}
      />
      {stats.duration && (
        <StatCard
          label="Days"
          value={stats.duration}
          icon={<Clock className="w-5 h-5" />}
          iconColor="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] dark:bg-[hsl(var(--primary)/0.15)] dark:text-[hsl(var(--primary))]"
        />
      )}
      <StatCard
        label="Total Expenses"
        value={formatCurrency(stats.totalExpenses, stats.currency)}
        icon={<Receipt className="w-5 h-5" />}
        iconColor="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] dark:bg-[hsl(var(--primary)/0.15)] dark:text-[hsl(var(--primary))]"
        href={ROUTES.tripExpenses(tripId)}
      />
      <StatCard
        label="Items Packed"
        value={`${stats.coveredItems}/${stats.totalItems}`}
        icon={<Package className="w-5 h-5" />}
        iconColor="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] dark:bg-[hsl(var(--primary)/0.15)] dark:text-[hsl(var(--primary))]"
        href={ROUTES.tripSupplies(tripId)}
      />
      <StatCard
        label="Open Votes"
        value={stats.openVoteCount}
        icon={<Vote className="w-5 h-5" />}
        iconColor="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] dark:bg-[hsl(var(--primary)/0.15)] dark:text-[hsl(var(--primary))]"
        href={ROUTES.tripVotes(tripId)}
      />
    </motion.div>
  );
}
