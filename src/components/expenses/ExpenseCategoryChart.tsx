"use client";

import { PieChart } from "lucide-react";
import { useMemo } from "react";
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { ExpenseSerialized } from "./types";

interface ExpenseCategoryChartProps {
  expenses: ExpenseSerialized[];
  currency: string;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(243 75% 78%)",
  "hsl(220 9% 58%)",
];

export function ExpenseCategoryChart({ expenses, currency }: ExpenseCategoryChartProps) {
  const data = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of expenses) {
      const key = e.category ?? "Other";
      totals.set(key, (totals.get(key) ?? 0) + e.totalAmount);
    }
    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  if (data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="app-surface rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.12)]">
          <PieChart className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">By category</h3>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={40}
              outerRadius={70}
              strokeWidth={0}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value, currency)}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </RePieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 space-y-1.5">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="flex-1 truncate">{d.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {Math.round((d.value / total) * 100)}%
            </span>
            <span className="tabular-nums font-medium w-16 text-right">
              {formatCurrency(d.value, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
