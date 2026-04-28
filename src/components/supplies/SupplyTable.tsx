"use client";

import { motion } from "framer-motion";
import { staggerContainer, listItem } from "@/lib/motion";
import { SupplyRow } from "./SupplyRow";
import type { SupplyItemSerialized } from "./types";

interface SupplyTableProps {
  tripId: string;
  items: SupplyItemSerialized[];
  currency: string;
  selectedItemId?: string | null;
  selectedBulkIds?: string[];
  onSelectItem?: (id: string) => void;
  onToggleBulk?: (id: string) => void;
  onToggleBulkAll?: () => void;
}

export function SupplyTable({
  tripId,
  items,
  currency,
  selectedItemId,
  selectedBulkIds = [],
  onSelectItem,
  onToggleBulk,
  onToggleBulkAll,
}: SupplyTableProps) {
  const groups = groupByCategory(items);
  const allSelected = items.length > 0 && selectedBulkIds.length === items.length;

  return (
    <div className="space-y-6">
      {groups.map(([category, categoryItems]) => (
        <section key={category}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
            {category}
          </h3>

          <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            <label className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleBulkAll}
                aria-label="Select all items"
                className="h-4 w-4 rounded border-input"
              />
            </label>
            <span>Item</span>
            <span className="w-20 text-right">Needed</span>
            <span className="w-20 text-right">Owned</span>
            <span className="w-24 text-right">Est. cost</span>
            <span className="w-36">Bringer</span>
            <span className="w-6" />
          </div>

          <div className="overflow-x-auto rounded-2xl [-webkit-overflow-scrolling:touch]">
            <div className="min-w-[640px]">
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="app-surface divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 shadow-sm"
              >
            {categoryItems.map((item) => (
              <motion.div key={item.id} id={`supply-row-${item.id}`} variants={listItem}>
                <SupplyRow
                  tripId={tripId}
                  item={item}
                  currency={currency}
                  selected={selectedItemId === item.id}
                  bulkSelected={selectedBulkIds.includes(item.id)}
                  onSelect={() => onSelectItem?.(item.id)}
                  onToggleBulk={() => onToggleBulk?.(item.id)}
                />
              </motion.div>
            ))}
              </motion.div>
            </div>
          </div>
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
