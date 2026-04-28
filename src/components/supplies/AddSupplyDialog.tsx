"use client";

import { useState } from "react";
import { X, Loader2, Package } from "lucide-react";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { SUPPLY_CATEGORIES } from "@/lib/constants";
import { useTripContext } from "@/components/trip/TripContext";
import { createSupplyItem } from "@/actions/supplies";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AddSupplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  onSupplyCreated?: (itemId: string) => void;
}

export function AddSupplyDialog({
  open,
  onOpenChange,
  tripId,
  onSupplyCreated,
}: AddSupplyDialogProps) {
  const { members } = useTripContext();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(SUPPLY_CATEGORIES[0]);
  const [quantityNeeded, setQuantityNeeded] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [whoBringsId, setWhoBringsId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function reset() {
    setName("");
    setCategory(SUPPLY_CATEGORIES[0]);
    setQuantityNeeded(1);
    setEstimatedCost(0);
    setWhoBringsId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const trimmed = name.trim();
      const { item } = await createSupplyItem(tripId, {
        name: trimmed,
        category,
        quantityNeeded,
        estimatedCost: estimatedCost > 0 ? estimatedCost : undefined,
        whoBringsId: whoBringsId || undefined,
      });
      await router.refresh();
      reset();
      onOpenChange(false);
      toast.success(`Added “${trimmed}”`, {
        description: "Listed in your supplies below.",
        action: onSupplyCreated
          ? {
              label: "View",
              onClick: () => onSupplyCreated(item.id),
            }
          : undefined,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative mt-auto flex max-h-[min(92dvh,34rem)] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-xl sm:mt-0 sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-base">Add supply item</h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[min(72dvh,30rem)] space-y-4 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <div>
            <label className="text-sm font-medium block mb-1.5">Item name *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tent, Sunscreen, First-aid kit…"
              className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base sm:min-h-10 sm:text-sm touch-manipulation focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base sm:min-h-10 sm:text-sm touch-manipulation focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {SUPPLY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Quantity needed</label>
              <input
                type="number"
                min={0}
                value={quantityNeeded}
                onChange={(e) => setQuantityNeeded(parseInt(e.target.value, 10) || 0)}
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base sm:min-h-10 sm:text-sm touch-manipulation focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <CurrencyInput
            value={estimatedCost}
            onChange={setEstimatedCost}
            label="Estimated cost (each)"
          />

          <div>
            <label className="text-sm font-medium block mb-1.5">Who brings?</label>
            <select
              value={whoBringsId}
              onChange={(e) => setWhoBringsId(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base sm:min-h-10 sm:text-sm touch-manipulation focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.user.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 touch-manipulation"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Add item
          </button>
        </form>
      </div>
    </div>
  );
}
