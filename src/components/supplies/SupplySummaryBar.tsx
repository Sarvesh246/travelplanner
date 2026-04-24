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
    <div className="bg-card border border-border rounded-2xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <Cell icon={<Package className="w-4 h-4" />} label="Total items" value={stats.total.toString()} iconClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
      <Cell icon={<CheckCircle2 className="w-4 h-4" />} label="Packed" value={`${stats.covered} / ${stats.total}`} iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
      <Cell icon={<DollarSign className="w-4 h-4" />} label="Estimated" value={formatCurrency(stats.estimated, currency)} iconClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Progress</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="text-sm font-semibold w-10 text-right">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

function Cell({ icon, label, value, iconClass }: { icon: React.ReactNode; label: string; value: string; iconClass: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold truncate">{value}</p>
      </div>
    </div>
  );
}
