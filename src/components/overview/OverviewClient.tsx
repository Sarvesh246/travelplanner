"use client";

import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import { StatCard } from "./StatCard";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { LocalDateTime } from "@/components/shared/LocalDateTime";
import {
  Users, Map, Clock, Receipt, Package, Vote, Activity
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
  recentActivity: Array<{ id: string; label: string; at: string; kind: "stop" | "supply" | "expense" }>;
  tripId: string;
}

export function OverviewClient({ stats, recentActivity, tripId }: OverviewClientProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[480px]:gap-4 sm:grid-cols-3"
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

      <section className="app-surface rounded-2xl p-4">
        <h3 className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold">
          <Activity className="h-4 w-4 text-primary" />
          Recent activity
        </h3>
        <div className="space-y-2">
          {recentActivity.length > 0 ? (
            recentActivity.map((event) => (
              <div key={`${event.kind}-${event.id}`} className="rounded-lg border border-border/70 bg-card/65 px-3 py-2">
                <p className="text-sm">{event.label}</p>
                <LocalDateTime
                  className="text-xs text-muted-foreground"
                  value={event.at}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent updates yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
