"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StickyActionBar } from "@/components/layout/StickyActionBar";
import { Package, Plus, Map, Receipt } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { SupplySummaryBar } from "./SupplySummaryBar";
import { SupplyTable } from "./SupplyTable";
import { AddSupplyDialog } from "./AddSupplyDialog";
import { SupplyDetailPanel } from "./SupplyDetailPanel";
import { useTripContext } from "@/components/trip/TripContext";
import { bulkDeleteSupplyItems, bulkMarkBought, restoreSupplyItem } from "@/actions/supplies";
import { toast } from "sonner";
import type { SupplyItemSerialized } from "./types";

interface SuppliesClientProps {
  tripId: string;
  currency: string;
  items: SupplyItemSerialized[];
}

export function SuppliesClient({ tripId, currency, items }: SuppliesClientProps) {
  const { canEdit } = useTripContext();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [bulkIds, setBulkIds] = useState<string[]>([]);

  const stats = useMemo(() => {
    const total = items.length;
    const covered = items.filter((i) => i.status === "COVERED" || i.status === "NOT_NEEDED").length;
    const estimated = items.reduce((sum, i) => sum + (i.estimatedCost ?? 0) * i.quantityNeeded, 0);
    const actual = items.reduce((sum, i) => sum + (i.actualCost ?? 0), 0);
    return { total, covered, estimated, actual };
  }, [items]);
  const effectiveSelectedItemId =
    selectedItemId && items.some((item) => item.id === selectedItemId)
      ? selectedItemId
      : items[0]?.id ?? null;
  const selectedItem = items.find((item) => item.id === effectiveSelectedItemId) ?? null;

  async function handleBulkCover() {
    if (bulkIds.length === 0) return;
    await bulkMarkBought(bulkIds);
    toast.success(`${bulkIds.length} item${bulkIds.length === 1 ? "" : "s"} marked covered`);
    setBulkIds([]);
  }

  async function handleBulkDelete() {
    if (bulkIds.length === 0) return;
    const ids = [...bulkIds];
    await bulkDeleteSupplyItems(ids);
    toast.success(`${ids.length} item${ids.length === 1 ? "" : "s"} removed`, {
      action: {
        label: "Undo",
        onClick: () => {
          for (const id of ids) void restoreSupplyItem(id);
        },
      },
    });
    setBulkIds([]);
  }

  function handleTableRoving(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const index = items.findIndex((item) => item.id === selectedItemId);
    if (index < 0) return;
    e.preventDefault();
    const nextIndex = e.key === "ArrowDown" ? Math.min(items.length - 1, index + 1) : Math.max(0, index - 1);
    const next = items[nextIndex];
    if (next) setSelectedItemId(next.id);
  }

  return (
    <>
      <PageHeader
        eyebrow="Pack list"
        title="Supplies"
        description={`${items.length} item${items.length !== 1 ? "s" : ""} tracked`}
        actions={
          canEdit && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="app-hover-lift hidden md:inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
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
            <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="app-hover-lift inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 min-h-11 text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add first item
                </button>
              )}
              <Link
                href={ROUTES.tripItinerary(tripId)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 min-h-11 text-sm font-medium transition-colors hover:bg-muted/70"
              >
                <Map className="h-4 w-4 shrink-0" /> Itinerary
              </Link>
              <Link
                href={ROUTES.tripExpenses(tripId)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 min-h-11 text-sm font-medium transition-colors hover:bg-muted/70"
              >
                <Receipt className="h-4 w-4 shrink-0" /> Expenses
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
          <div className="space-y-3" onKeyDown={handleTableRoving}>
            {bulkIds.length > 0 ? (
              <div className="app-surface flex flex-wrap items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm">
                <span className="font-medium">{bulkIds.length} selected</span>
                <button
                  type="button"
                  onClick={() => void handleBulkCover()}
                  className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium hover:bg-muted"
                >
                  Mark covered
                </button>
                <button
                  type="button"
                  onClick={() => void handleBulkDelete()}
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/15"
                >
                  Delete selected
                </button>
                <button
                  type="button"
                  onClick={() => setBulkIds([])}
                  className="rounded-lg px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
                >
                  Clear
                </button>
              </div>
            ) : null}
            <SupplyTable
              items={items}
              currency={currency}
              selectedItemId={effectiveSelectedItemId}
              selectedBulkIds={bulkIds}
              onSelectItem={setSelectedItemId}
              onToggleBulk={(id) =>
                setBulkIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
              }
              onToggleBulkAll={() =>
                setBulkIds((prev) => (prev.length === items.length ? [] : items.map((item) => item.id)))
              }
            />
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <SupplyDetailPanel item={selectedItem} currency={currency} />
            </div>
          </aside>
        </div>
      )}

      <AddSupplyDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        tripId={tripId}
      />

      {canEdit ? (
        <StickyActionBar
          primary={
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add item
            </button>
          }
        />
      ) : null}
    </>
  );
}
