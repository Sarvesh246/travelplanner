"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StickyActionBar } from "@/components/layout/StickyActionBar";
import { Package, Plus, Map, Receipt } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { SupplySummaryBar } from "./SupplySummaryBar";
import { SupplyTable } from "./SupplyTable";
import { AddSupplyDialog } from "./AddSupplyDialog";
import { ImportSupplyDialog } from "./ImportSupplyDialog";
import { useTripContext } from "@/components/trip/TripContext";
import { readTripUiPrefs, writeTripUiPrefs } from "@/lib/trip-ui-preferences";
import { bulkDeleteSupplyItems, bulkMarkBought, restoreSupplyItem } from "@/actions/supplies";
import { toast } from "sonner";
import { supplyAnchorForId, parseSupplyHash } from "@/lib/deep-link-hash";
import type { SupplyItemSerialized } from "./types";

interface SuppliesClientProps {
  tripId: string;
  currency: string;
  items: SupplyItemSerialized[];
}

export function SuppliesClient({ tripId, currency, items }: SuppliesClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { canEdit, currentUser } = useTripContext();
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [bulkIds, setBulkIds] = useState<string[]>([]);

  const [mine, setMine] = useState(() => readTripUiPrefs(tripId).supplyMine ?? false);
  const [statusSel, setStatusSel] = useState<string>("");
  const [categorySel, setCategorySel] = useState<string>("");
  useEffect(() => {
    writeTripUiPrefs(tripId, { supplyMine: mine });
  }, [tripId, mine]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(items.map((item) => item.category?.trim()).filter((value): value is string => Boolean(value)))
    ).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (mine) {
      list = list.filter(
        (i) => i.whoBringsId === currentUser.id || i.whoBought?.id === currentUser.id
      );
    }
    if (statusSel) list = list.filter((i) => i.status === statusSel);
    if (categorySel) list = list.filter((i) => (i.category ?? "Other") === categorySel);
    return list;
  }, [categorySel, currentUser.id, items, mine, statusSel]);

  const stats = useMemo(() => {
    const total = filteredItems.length;
    const covered = filteredItems.filter((i) => i.status === "COVERED" || i.status === "NOT_NEEDED").length;
    const estimated = filteredItems.reduce((sum, i) => sum + (i.estimatedCost ?? 0) * i.quantityNeeded, 0);
    const actual = filteredItems.reduce((sum, i) => sum + (i.actualCost ?? 0), 0);
    return { total, covered, estimated, actual };
  }, [filteredItems]);
  const effectiveSelectedItemId =
    selectedItemId && filteredItems.some((item) => item.id === selectedItemId)
      ? selectedItemId
      : filteredItems[0]?.id ?? null;

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

  function scrollSupplyRowIntoView(id: string) {
    requestAnimationFrame(() => {
      const prefers =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(`supply-row-${id}`)?.scrollIntoView({
        behavior: prefers ? "instant" : "smooth",
        block: "nearest",
      });
    });
  }

  function revealSupply(id: string, opts?: { syncUrl?: boolean }) {
    setSelectedItemId(id);
    if (opts?.syncUrl) {
      const next = `${pathname}#${supplyAnchorForId(id)}`;
      if (typeof window !== "undefined" && `${window.location.pathname}${window.location.hash}` !== next) {
        router.replace(next, { scroll: false });
      }
    }
    scrollSupplyRowIntoView(id);
  }

  useEffect(() => {
    function sync() {
      if (typeof window === "undefined") return;
      const id = parseSupplyHash(window.location.hash);
      if (!id) return;
      if (!items.some((it) => it.id === id)) return;
      setSelectedItemId(id);
      scrollSupplyRowIntoView(id);
    }

    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [items]);

  function handleTableRoving(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const index = filteredItems.findIndex((item) => item.id === selectedItemId);
    if (index < 0) return;
    e.preventDefault();
    const nextIndex = e.key === "ArrowDown" ? Math.min(filteredItems.length - 1, index + 1) : Math.max(0, index - 1);
    const next = filteredItems[nextIndex];
    if (next) setSelectedItemId(next.id);
  }

  return (
    <>
      <PageHeader
        eyebrow="Pack list"
        title="Supplies"
        description={`Showing ${filteredItems.length} of ${items.length} item${items.length !== 1 ? "s" : ""}`}
        actions={
          canEdit && items.length > 0 && (
            <div className="hidden items-center gap-2 md:inline-flex">
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="app-hover-lift inline-flex items-center gap-2 rounded-xl border border-border bg-card/85 px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted/70"
              >
                <Package className="w-4 h-4" />
                Import list
              </button>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="app-hover-lift inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          )
        }
      />

      {items.length > 0 ? <SupplySummaryBar stats={stats} currency={currency} /> : null}

      {items.length === 0 ? (
        <EmptyState
          icon={<Package className="w-7 h-7" />}
          title="No supplies yet"
          description="Track gear, food, documents, and everything you need to bring."
          action={
            <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={() => setImportOpen(true)}
                    className="app-hover-lift inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/70"
                  >
                    <Package className="w-4 h-4" /> Import list
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="app-hover-lift inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 min-h-11 text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add first item
                  </button>
                </>
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
        <div className="min-w-0 max-w-full">
          <div className="min-w-0 max-w-full" onKeyDown={handleTableRoving}>
            <div className="sticky top-14 z-[8] mb-3 rounded-xl border border-border/65 bg-[hsl(var(--card)/0.92)] p-3 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.65)] backdrop-blur-md transition-shadow duration-200 dark:bg-card/82">
              <div className="flex max-w-full flex-wrap items-center gap-x-5 gap-y-3 text-xs md:text-sm">
                <label className="flex items-center gap-2 font-medium text-muted-foreground">
                  <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> My packing
                </label>
                <span className="hidden h-4 w-px shrink-0 bg-border min-[560px]:block" aria-hidden />
                <label className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
                  Status
                  <select
                    value={statusSel}
                    onChange={(e) => setStatusSel(e.target.value)}
                    className="ml-2 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold capitalize normal-case"
                  >
                    <option value="">All</option>
                    {["NEEDED", "PARTIALLY_COVERED", "COVERED", "NOT_NEEDED"].map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
                  Category
                  <select
                    value={categorySel}
                    onChange={(e) => setCategorySel(e.target.value)}
                    className="ml-2 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold normal-case"
                  >
                    <option value="">All</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                    {!categoryOptions.includes("Other") && <option value="Other">Other</option>}
                  </select>
                </label>
              </div>
            </div>
            {bulkIds.length > 0 ? (
              <div className="app-surface mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm">
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
            <div className="mt-3">
              <SupplyTable
                tripId={tripId}
                items={filteredItems}
                currency={currency}
                selectedItemId={effectiveSelectedItemId}
                selectedBulkIds={bulkIds}
                onSelectItem={setSelectedItemId}
                onToggleBulk={(id) =>
                  setBulkIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
                }
                onToggleBulkAll={() =>
                  setBulkIds((prev) =>
                    prev.length === filteredItems.length ? [] : filteredItems.map((item) => item.id)
                  )
                }
              />
            </div>
          </div>
        </div>
      )}

      <AddSupplyDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        tripId={tripId}
        onSupplyCreated={(id) => revealSupply(id, { syncUrl: true })}
      />

      <ImportSupplyDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        tripId={tripId}
        currency={currency}
      />

      {canEdit && items.length > 0 ? (
        <StickyActionBar
          primary={
            <div className="grid w-full grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold shadow-sm transition-colors hover:bg-muted"
              >
                <Package className="h-4 w-4" />
                Import
              </button>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Add item
              </button>
            </div>
          }
        />
      ) : null}
    </>
  );
}
