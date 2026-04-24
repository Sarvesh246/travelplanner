"use client";

import { useState } from "react";
import { X, Loader2, Package } from "lucide-react";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { SUPPLY_CATEGORIES } from "@/lib/constants";
import { useTripContext } from "@/components/trip/TripContext";
import { createSupplyItem } from "@/actions/supplies";
import { toast } from "sonner";

interface AddSupplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
}

export function AddSupplyDialog({ open, onOpenChange, tripId }: AddSupplyDialogProps) {
  const { members } = useTripContext();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(SUPPLY_CATEGORIES[0]);
  const [quantityNeeded, setQuantityNeeded] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [whoBringsId, setWhoBringsId] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
      await createSupplyItem(tripId, {
        name: name.trim(),
        category,
        quantityNeeded,
        estimatedCost: estimatedCost > 0 ? estimatedCost : undefined,
        whoBringsId: whoBringsId || undefined,
      });
      toast.success("Item added");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Item name *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tent, Sunscreen, First-aid kit…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Add item
          </button>
        </form>
      </div>
    </div>
  );
}
