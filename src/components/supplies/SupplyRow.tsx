"use client";

import { useState } from "react";
import { CheckCircle2, Link2, MoreHorizontal, Trash2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ROUTES, SUPPLY_STATUS_COLORS } from "@/lib/constants";
import { supplyAnchorForId } from "@/lib/deep-link-hash";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useTripContext } from "@/components/trip/TripContext";
import {
  deleteSupplyItem,
  markBought,
  restoreSupplyItem,
  updateSupplyItem,
} from "@/actions/supplies";
import { toast } from "sonner";
import { toastWithUndo } from "@/lib/undo-toast";
import type { SupplyItemSerialized } from "./types";

interface SupplyRowProps {
  tripId: string;
  item: SupplyItemSerialized;
  currency: string;
  selected?: boolean;
  bulkSelected?: boolean;
  onSelect?: () => void;
  onToggleBulk?: () => void;
}

export function SupplyRow({
  tripId,
  item,
  currency,
  selected = false,
  bulkSelected = false,
  onSelect,
  onToggleBulk,
}: SupplyRowProps) {
  const { members, canEdit } = useTripContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const totalEstimatedCost =
    item.estimatedCost !== null ? item.estimatedCost * item.quantityNeeded : null;

  async function updateQty(field: "quantityNeeded" | "quantityOwned", value: number) {
    try {
      await updateSupplyItem(item.id, { [field]: Math.max(0, value) }, { recordUndo: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the quantity. Please try again.");
    }
  }

  async function updateBringer(userId: string | null) {
    try {
      const result = await updateSupplyItem(item.id, { whoBringsId: userId });
      if (result.undoTokenId) {
        toastWithUndo("Assignment updated", result.undoTokenId);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not assign this item. Please try again.");
    }
  }

  async function handleMarkBought() {
    setMenuOpen(false);
    try {
      await markBought(item.id);
      toast.success("Marked as covered");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not mark this item covered. Please try again.");
    }
  }

  async function copySupplyDeepLink(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      await navigator.clipboard.writeText(
        `${origin}${ROUTES.tripSupplies(tripId)}#${supplyAnchorForId(item.id)}`
      );
      toast.success("Link copied", {
        description: "Anyone with trip access can open this item after signing in.",
      });
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function handleDelete() {
    try {
      await deleteSupplyItem(item.id);
      toast.success("Item removed", {
        action: {
          label: "Undo",
          onClick: () => {
            void restoreSupplyItem(item.id);
          },
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove this item. Please try again.");
    }
  }

  return (
    <>
      <div
        className={cn(
          "group px-4 py-3 md:grid md:grid-cols-[auto_minmax(0,1fr)_5rem_5rem_7rem_9rem_9rem] md:items-center md:gap-4",
          "flex flex-col gap-3",
          selected && "bg-primary/5"
        )}
      >
        <div className="hidden md:block">
          <input
            type="checkbox"
            checked={bulkSelected}
            onChange={() => onToggleBulk?.()}
            aria-label={`Select ${item.name}`}
            className="h-4 w-4 rounded border-input"
          />
        </div>

        <div className="min-w-0 flex items-center gap-3">
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              SUPPLY_STATUS_COLORS[item.status] === "text-success"
                ? "[background-color:hsl(var(--success))]"
                : SUPPLY_STATUS_COLORS[item.status] === "text-warning"
                  ? "[background-color:hsl(var(--warning))]"
                  : SUPPLY_STATUS_COLORS[item.status] === "text-destructive"
                    ? "[background-color:hsl(var(--destructive))]"
                    : "bg-muted-foreground"
            )}
          />
          <button type="button" onClick={onSelect} className="min-w-0 text-left">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <p className={cn("text-xs", SUPPLY_STATUS_COLORS[item.status])}>
              {item.status.replace("_", " ")}
            </p>
          </button>
        </div>

        <div className="hidden w-20 md:block text-right">
          <NumberInput value={item.quantityNeeded} onChange={(v) => updateQty("quantityNeeded", v)} canEdit={canEdit} />
        </div>
        <div className="hidden w-20 md:block text-right">
          <NumberInput value={item.quantityOwned} onChange={(v) => updateQty("quantityOwned", v)} canEdit={canEdit} />
        </div>
        <div className="hidden w-28 md:block text-right text-sm text-muted-foreground">
          {totalEstimatedCost !== null ? formatCurrency(totalEstimatedCost, currency) : "—"}
        </div>

        <div className="hidden w-36 md:block">
          {canEdit ? (
            <select
              value={item.whoBringsId ?? ""}
              onChange={(e) => updateBringer(e.target.value || null)}
              className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.user.name}
                </option>
              ))}
            </select>
          ) : item.whoBrings ? (
            <div className="flex items-center gap-1.5">
              <UserAvatar name={item.whoBrings.name} avatarUrl={item.whoBrings.avatarUrl} size="xs" />
              <span className="truncate text-xs">{item.whoBrings.name}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          )}
        </div>

        <div className="flex w-full items-center justify-between gap-3 md:w-36 md:justify-end">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground md:hidden">
            <span>
              {item.quantityOwned}/{item.quantityNeeded} on hand
            </span>
            {totalEstimatedCost !== null && <span>{formatCurrency(totalEstimatedCost, currency)}</span>}
            {item.whoBrings && <span>Brings: {item.whoBrings.name}</span>}
          </div>

          {canEdit ? (
            <div className="flex items-center gap-1 md:ml-auto">
              <div className="hidden md:flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  type="button"
                  title="Copy link"
                  aria-label={`Copy trip link for ${item.name}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/90 text-muted-foreground shadow-sm transition-colors hover:border-primary/35 hover:bg-primary/10 hover:text-primary"
                  onClick={(e) => void copySupplyDeepLink(e)}
                >
                  <Link2 className="h-4 w-4" />
                </button>
                {item.status !== "COVERED" && (
                  <button
                    type="button"
                    title="Mark covered"
                    aria-label={`Mark ${item.name} as covered`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/90 text-muted-foreground shadow-sm transition-colors hover:border-success/35 hover:bg-success/10 hover:text-success"
                    onClick={() => void handleMarkBought()}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  title="Delete item"
                  aria-label={`Delete ${item.name}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/90 text-muted-foreground shadow-sm transition-colors hover:border-destructive/45 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="relative z-[6]">
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
                  aria-label="Item options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-border bg-popover py-1 shadow-lg">
                      <button
                        type="button"
                        onClick={(e) => void copySupplyDeepLink(e)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
                      >
                        <Link2 className="h-3.5 w-3.5 shrink-0" /> Copy trip link
                      </button>
                      {item.status !== "COVERED" && (
                        <button
                          onClick={handleMarkBought}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark covered
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setConfirmDelete(true);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}
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

function NumberInput({
  value,
  onChange,
  canEdit,
}: {
  value: number;
  onChange: (v: number) => void;
  canEdit: boolean;
}) {
  if (!canEdit) {
    return <span className="text-sm">{value}</span>;
  }

  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      className="w-16 rounded-lg border border-input bg-background px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}
