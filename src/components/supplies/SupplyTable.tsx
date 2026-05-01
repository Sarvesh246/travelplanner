"use client";

import { motion } from "framer-motion";
import { listItem, staggerContainer } from "@/lib/motion";
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
    <div className="min-w-0 max-w-full space-y-4">
      {groups.map(([category, categoryItems]) => (
        <section key={category}>
          <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {category}
          </h3>

          <div className="hidden px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground lg:grid lg:grid-cols-[auto_minmax(0,1fr)_5rem_5rem_5.75rem_5rem_minmax(8rem,10rem)_8rem] lg:items-center lg:gap-x-3 lg:gap-y-1 xl:gap-x-4">
            <label className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleBulkAll}
                aria-label="Select all items"
                className="h-4 w-4 rounded border-input"
              />
            </label>
            <span className="min-w-0">Item</span>
            <span className="text-center">Needed</span>
            <span className="text-center">Owned</span>
            <span className="text-center leading-tight">Est. cost</span>
            <span className="text-center">Each</span>
            <span className="text-center leading-tight">Bringer</span>
            <span className="text-center leading-tight">Actions</span>
          </div>

          <div className="min-w-0 max-w-full rounded-2xl">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="app-surface min-w-0 max-w-full divide-y divide-border/70 rounded-2xl border border-border/70 shadow-sm"
            >
              {categoryItems.map((item) => (
                <motion.div
                  key={`${item.id}:${item.quantityNeeded}:${item.quantityOwned}:${item.status}:${item.whoBringsId ?? ""}`}
                  id={`supply-row-${item.id}`}
                  variants={listItem}
                >
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
