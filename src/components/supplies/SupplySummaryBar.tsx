"use client";

import { motion } from "framer-motion";
import { Package, DollarSign, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SupplySummaryBarProps {
  stats: {
    total: number;
    covered: number;
    estimated: number;
    actual: number;
  };
  currency: string;
}

export function SupplySummaryBar({ stats, currency }: SupplySummaryBarProps) {
  const pct = stats.total > 0 ? Math.round((stats.covered / stats.total) * 100) : 0;

  return (
    <div className="app-surface rounded-2xl p-4 mb-5 grid grid-cols-2 md:grid-cols-4 gap-4">
      <Cell icon={<Package className="w-4 h-4" />} label="Total items" value={stats.total.toString()} iconClass="bg-[hsl(var(--secondary)/0.1)] text-[hsl(var(--secondary))] dark:bg-[hsl(var(--secondary)/0.15)]" />
      <Cell icon={<CheckCircle2 className="w-4 h-4" />} label="Packed" value={`${stats.covered} / ${stats.total}`} iconClass="bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] dark:bg-[hsl(var(--success)/0.15)]" />
      <Cell icon={<DollarSign className="w-4 h-4" />} label="Estimated" value={formatCurrency(stats.estimated, currency)} iconClass="bg-[hsl(var(--accent)/0.1)] text-[hsl(var(--accent))] dark:bg-[hsl(var(--accent)/0.15)]" />
      <div className="min-w-0 md:col-span-1 col-span-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Progress</p>
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex-1 min-w-0 h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full max-w-full rounded-full bg-primary shadow-[0_0_14px_hsl(var(--primary)/0.35)]"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="shrink-0 tabular-nums text-sm font-semibold min-w-[2.5rem] text-right">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

function Cell({ icon, label, value, iconClass }: { icon: React.ReactNode; label: string; value: string; iconClass: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-[inset_0_0_0_1px_hsl(var(--foreground)/0.04)] ${iconClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold truncate">{value}</p>
      </div>
    </div>
  );
}
