"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2, CheckCircle2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { SUPPLY_STATUS_COLORS } from "@/lib/constants";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useTripContext } from "@/components/trip/TripContext";
import { updateSupplyItem, deleteSupplyItem, markBought } from "@/actions/supplies";
import { toast } from "sonner";
import type { SupplyItemSerialized } from "./types";

interface SupplyRowProps {
  item: SupplyItemSerialized;
  currency: string;
}

export function SupplyRow({ item, currency }: SupplyRowProps) {
  const { members, canEdit } = useTripContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function updateQty(field: "quantityNeeded" | "quantityOwned", value: number) {
    try {
      await updateSupplyItem(item.id, { [field]: Math.max(0, value) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function updateBringer(userId: string | null) {
    try {
      await updateSupplyItem(item.id, { whoBringsId: userId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleMarkBought() {
    setMenuOpen(false);
    try {
      await markBought(item.id);
      toast.success("Marked as covered");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleDelete() {
    try {
      await deleteSupplyItem(item.id);
      toast.success("Item removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <>
      <div className="px-4 py-3 md:grid md:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center flex flex-col md:flex-row">
        <div className="min-w-0 flex items-center gap-3 flex-1 w-full">
          <span className={cn("w-2 h-2 rounded-full shrink-0", SUPPLY_STATUS_COLORS[item.status] === "text-success" ? "bg-emerald-500" : SUPPLY_STATUS_COLORS[item.status] === "text-warning" ? "bg-amber-500" : SUPPLY_STATUS_COLORS[item.status] === "text-destructive" ? "bg-red-500" : "bg-muted-foreground")} />
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{item.name}</p>
            <p className={cn("text-xs", SUPPLY_STATUS_COLORS[item.status])}>{item.status.replace("_", " ")}</p>
          </div>
        </div>

        <div className="w-20 hidden md:block text-right">
          <NumberInput value={item.quantityNeeded} onChange={(v) => updateQty("quantityNeeded", v)} canEdit={canEdit} />
        </div>
        <div className="w-20 hidden md:block text-right">
          <NumberInput value={item.quantityOwned} onChange={(v) => updateQty("quantityOwned", v)} canEdit={canEdit} />
        </div>
        <div className="w-24 hidden md:block text-right text-sm text-muted-foreground">
          {item.estimatedCost !== null ? formatCurrency(item.estimatedCost, currency) : "—"}
        </div>

        <div className="w-36 hidden md:block">
          {canEdit ? (
            <select
              value={item.whoBringsId ?? ""}
              onChange={(e) => updateBringer(e.target.value || null)}
              className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.user.name}</option>
              ))}
            </select>
          ) : item.whoBrings ? (
            <div className="flex items-center gap-1.5">
              <UserAvatar name={item.whoBrings.name} avatarUrl={item.whoBrings.avatarUrl} size="xs" />
              <span className="text-xs truncate">{item.whoBrings.name}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          )}
        </div>

        <div className="md:w-6 w-full flex md:justify-end justify-between md:mt-0 mt-2">
          <div className="md:hidden flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{item.quantityOwned}/{item.quantityNeeded} on hand</span>
            {item.estimatedCost !== null && <span>{formatCurrency(item.estimatedCost, currency)}</span>}
            {item.whoBrings && <span>Brings: {item.whoBrings.name}</span>}
          </div>
          {canEdit && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Item options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-xl shadow-lg py-1 z-20">
                    {item.status !== "COVERED" && (
                      <button onClick={handleMarkBought} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark covered
                      </button>
                    )}
                    <button onClick={() => { setMenuOpen(false); setConfirmDelete(true); }} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${item.name}"?`}
        description="This will remove the item from the supplies list."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </>
  );
}

function NumberInput({ value, onChange, canEdit }: { value: number; onChange: (v: number) => void; canEdit: boolean }) {
  if (!canEdit) {
    return <span className="text-sm">{value}</span>;
  }
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      className="w-16 rounded-lg border border-input bg-background px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}
