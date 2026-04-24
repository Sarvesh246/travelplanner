"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Package, Plus } from "lucide-react";
import { SupplySummaryBar } from "./SupplySummaryBar";
import { SupplyTable } from "./SupplyTable";
import { AddSupplyDialog } from "./AddSupplyDialog";
import { useTripContext } from "@/components/trip/TripContext";
import type { SupplyItemSerialized } from "./types";

interface SuppliesClientProps {
  tripId: string;
  currency: string;
  items: SupplyItemSerialized[];
}

export function SuppliesClient({ tripId, currency, items }: SuppliesClientProps) {
  const { canEdit } = useTripContext();
  const [addOpen, setAddOpen] = useState(false);

  const stats = useMemo(() => {
    const total = items.length;
    const covered = items.filter((i) => i.status === "COVERED" || i.status === "NOT_NEEDED").length;
    const estimated = items.reduce((sum, i) => sum + (i.estimatedCost ?? 0) * i.quantityNeeded, 0);
    const actual = items.reduce((sum, i) => sum + (i.actualCost ?? 0), 0);
    return { total, covered, estimated, actual };
  }, [items]);

  return (
    <>
      <PageHeader
        title="Supplies"
        description={`${items.length} item${items.length !== 1 ? "s" : ""} tracked`}
        actions={
          canEdit && (
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          )
        }
      />

      <SupplySummaryBar stats={stats} currency={currency} />

      {items.length === 0 ? (
        <EmptyState
          icon={<Package className="w-7 h-7" />}
          title="No supplies yet"
          description="Track gear, food, documents, and everything you need to bring."
          action={
            canEdit && (
              <button
                onClick={() => setAddOpen(true)}
                className="mt-2 flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add first item
              </button>
            )
          }
        />
      ) : (
        <SupplyTable items={items} currency={currency} />
      )}

      <AddSupplyDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        tripId={tripId}
      />
    </>
  );
}
