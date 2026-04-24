"use client";

import { motion } from "framer-motion";
import { ArrowRight, Scale } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useTripContext } from "@/components/trip/TripContext";
import type { MemberBalance, Settlement } from "@/lib/balance-calculator";

interface BalanceSummaryProps {
  balances: MemberBalance[];
  settlements: Settlement[];
  currency: string;
}

export function BalanceSummary({ balances, settlements, currency }: BalanceSummaryProps) {
  const { members } = useTripContext();
  const lookup = new Map(members.map((m) => [m.userId, m.user]));

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Scale className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">Balance</h3>
      </div>

      {balances.length > 0 && (
        <div className="space-y-2 mb-4">
          {balances
            .slice()
            .sort((a, b) => b.net - a.net)
            .map((b) => {
              const user = lookup.get(b.userId);
              if (!user) return null;
              const positive = b.net > 0.01;
              const negative = b.net < -0.01;

              return (
                <div key={b.userId} className="flex items-center gap-2 text-sm">
                  <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="xs" />
                  <span className="flex-1 truncate">{user.name}</span>
                  <span
                    className={`tabular-nums font-medium ${
                      positive
                        ? "text-success"
                        : negative
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  >
                    {positive && "+"}
                    {formatCurrency(b.net, currency)}
                  </span>
                </div>
              );
            })}
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Settlements
        </h4>
        {settlements.length === 0 ? (
          <p className="text-xs text-muted-foreground">All settled up</p>
        ) : (
          <motion.div
            initial="initial"
            animate="animate"
            variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
            className="space-y-1.5"
          >
            {settlements.map((s, i) => {
              const from = lookup.get(s.from);
              const to = lookup.get(s.to);
              if (!from || !to) return null;
              return (
                <motion.div
                  key={`${s.from}-${s.to}-${i}`}
                  variants={{
                    initial: { opacity: 0, y: 6 },
                    animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                  }}
                  className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg px-2.5 py-2"
                >
                  <UserAvatar name={from.name} avatarUrl={from.avatarUrl} size="xs" />
                  <span className="truncate">{from.name}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  <UserAvatar name={to.name} avatarUrl={to.avatarUrl} size="xs" />
                  <span className="truncate">{to.name}</span>
                  <span className="ml-auto tabular-nums font-semibold">
                    {formatCurrency(s.amount, currency)}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
