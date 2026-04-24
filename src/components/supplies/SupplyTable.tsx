"use client";

import { motion } from "framer-motion";
import { staggerContainer, listItem } from "@/lib/motion";
import { SupplyRow } from "./SupplyRow";
import type { SupplyItemSerialized } from "./types";

interface SupplyTableProps {
  items: SupplyItemSerialized[];
  currency: string;
}

export function SupplyTable({ items, currency }: SupplyTableProps) {
  const groups = groupByCategory(items);

  return (
    <div className="space-y-6">
      {groups.map(([category, categoryItems]) => (
        <section key={category}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
            {category}
          </h3>

          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            <span>Item</span>
            <span className="w-20 text-right">Needed</span>
            <span className="w-20 text-right">Owned</span>
            <span className="w-24 text-right">Est. cost</span>
            <span className="w-36">Bringer</span>
            <span className="w-6" />
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden"
          >
            {categoryItems.map((item) => (
              <motion.div key={item.id} variants={listItem}>
                <SupplyRow item={item} currency={currency} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      ))}
    </div>
  );
}

function groupByCategory(items: SupplyItemSerialized[]): [string, SupplyItemSerialized[]][] {
  const map = new Map<string, SupplyItemSerialized[]>();
  for (const item of items) {
    const key = item.category ?? "Other";
    const arr = map.get(key) ?? [];
    arr.push(item);
    map.set(key, arr);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}
