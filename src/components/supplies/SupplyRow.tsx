"use client";

import { useState } from "react";
import { CheckCircle2, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useTripContext } from "@/components/trip/TripContext";
import {
  deleteSupplyItem,
  markBought,
  restoreSupplyItem,
  updateSupplyItem,
} from "@/actions/supplies";
import { ROUTES, SUPPLY_STATUS_COLORS } from "@/lib/constants";
import { supplyAnchorForId } from "@/lib/deep-link-hash";
import { toastWithUndo } from "@/lib/undo-toast";
import { cn, formatCurrency } from "@/lib/utils";
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [neededValue, setNeededValue] = useState(item.quantityNeeded);
  const [ownedValue, setOwnedValue] = useState(item.quantityOwned);
  const totalEstimatedCost =
    item.estimatedCost !== null ? item.estimatedCost * neededValue : null;
  const optimisticStatus = computeStatus(neededValue, ownedValue);

  async function updateQty(field: "quantityNeeded" | "quantityOwned", value: number) {
    try {
      await updateSupplyItem(item.id, { [field]: Math.max(0, value) }, { recordUndo: false });
    } catch (err) {
      setNeededValue(item.quantityNeeded);
      setOwnedValue(item.quantityOwned);
      toast.error(
        err instanceof Error ? err.message : "Could not update the quantity. Please try again."
      );
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
    try {
      await markBought(item.id);
      toast.success("Marked as covered");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not mark this item covered. Please try again."
      );
    }
  }

  async function copySupplyDeepLink() {
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

  const bringerControl = canEdit ? (
    <select
      aria-label={`${item.name} bringer`}
      value={item.whoBringsId ?? ""}
      onChange={(e) => updateBringer(e.target.value || null)}
      className="h-10 w-full min-w-0 rounded-xl border border-input/80 bg-background/90 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring lg:max-w-[11.5rem] xl:max-w-[12rem]"
    >
      <option value="">Unassigned</option>
      {members.map((member) => (
        <option key={member.userId} value={member.userId}>
          {member.user.name}
        </option>
      ))}
    </select>
  ) : item.whoBrings ? (
    <div className="inline-flex h-10 max-w-[12rem] items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 text-sm">
      <UserAvatar name={item.whoBrings.name} avatarUrl={item.whoBrings.avatarUrl} size="xs" />
      <span className="truncate">{item.whoBrings.name}</span>
    </div>
  ) : (
    <div className="inline-flex h-10 items-center rounded-xl border border-border/70 bg-background/70 px-3 text-sm text-muted-foreground">
      Unassigned
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "rounded-2xl px-3 py-3 transition-colors hover:border-primary/20 hover:bg-primary/[0.03] md:px-4",
          selected && "bg-primary/5"
        )}
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-3 lg:grid-cols-[auto_minmax(12rem,1.15fr)_5.25rem_5.25rem_6.25rem_5.5rem_minmax(9.5rem,11.5rem)_auto] lg:items-center lg:gap-x-4 xl:gap-x-5">
          <div className="row-span-2 flex items-start pt-1 lg:row-span-1 lg:pt-0">
            <input
              type="checkbox"
              checked={bulkSelected}
              onChange={() => onToggleBulk?.()}
              aria-label={`Select ${item.name}`}
              className="h-4 w-4 rounded border-input"
            />
          </div>

          <button
            type="button"
            onClick={onSelect}
            className="min-w-0 text-left lg:col-start-2 lg:self-center"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={cn(
                  "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                  SUPPLY_STATUS_COLORS[optimisticStatus] === "text-success"
                    ? "[background-color:hsl(var(--success))]"
                    : SUPPLY_STATUS_COLORS[optimisticStatus] === "text-warning"
                      ? "[background-color:hsl(var(--warning))]"
                      : SUPPLY_STATUS_COLORS[optimisticStatus] === "text-destructive"
                        ? "[background-color:hsl(var(--destructive))]"
                        : "bg-muted-foreground"
                )}
              />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold leading-5 text-foreground">
                  {item.name}
                </p>
                <p
                  className={cn(
                    "mt-1 text-xs font-medium uppercase tracking-wide",
                    SUPPLY_STATUS_COLORS[optimisticStatus]
                  )}
                >
                  {optimisticStatus.replace("_", " ")}
                </p>
              </div>
            </div>
          </button>

          {canEdit ? (
            <div className="col-start-3 row-span-2 flex items-start justify-end gap-2 lg:col-start-8 lg:row-span-1 lg:self-center lg:justify-self-end">
              <ActionButton
                label={`Copy trip link for ${item.name}`}
                title="Copy link"
                onClick={() => void copySupplyDeepLink()}
              >
                <Link2 className="h-4 w-4" />
              </ActionButton>
              {optimisticStatus !== "COVERED" ? (
                <ActionButton
                  label={`Mark ${item.name} as covered`}
                  title="Mark covered"
                  onClick={() => void handleMarkBought()}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </ActionButton>
              ) : null}
              <ActionButton
                label={`Delete ${item.name}`}
                title="Delete item"
                destructive
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4" />
              </ActionButton>
            </div>
          ) : null}

          <div className="col-start-2 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-[5rem_5rem_5.75rem_5rem] sm:justify-start sm:gap-x-4 lg:contents">
            <MetricField label="Needed" className="lg:col-start-3 lg:self-start lg:pt-1">
              <NumberInput
                key={`needed:${item.id}:${item.quantityNeeded}`}
                ariaLabel={`${item.name} quantity needed`}
                value={neededValue}
                onValueChange={setNeededValue}
                onCommit={(value) => updateQty("quantityNeeded", value)}
                canEdit={canEdit}
              />
            </MetricField>
            <MetricField label="Owned" className="lg:col-start-4 lg:self-start lg:pt-1">
              <NumberInput
                key={`owned:${item.id}:${item.quantityOwned}`}
                ariaLabel={`${item.name} quantity owned`}
                value={ownedValue}
                onValueChange={setOwnedValue}
                onCommit={(value) => updateQty("quantityOwned", value)}
                canEdit={canEdit}
              />
            </MetricField>
            <MetricField label="Est. cost" className="lg:col-start-5 lg:self-start lg:pt-1">
              <ValuePill>
                {totalEstimatedCost !== null ? formatCurrency(totalEstimatedCost, currency) : "—"}
              </ValuePill>
            </MetricField>
            <MetricField label="Each" className="lg:col-start-6 lg:self-start lg:pt-1">
              <ValuePill>
                {item.estimatedCost !== null ? formatCurrency(item.estimatedCost, currency) : "—"}
              </ValuePill>
            </MetricField>
          </div>

          <div className="col-start-2 min-w-0 lg:col-start-7 lg:self-start lg:pt-6">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:hidden">
              Bringer
            </div>
            {bringerControl}
          </div>
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

function computeStatus(needed: number, owned: number) {
  if (needed <= 0) return "NOT_NEEDED";
  if (owned <= 0) return "NEEDED";
  if (owned >= needed) return "COVERED";
  return "PARTIALLY_COVERED";
}

function MetricField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function ValuePill({ children }: { children: React.ReactNode }) {
  return <div className="flex h-10 items-center text-sm font-semibold text-foreground">{children}</div>;
}

function ActionButton({
  label,
  title,
  destructive = false,
  onClick,
  children,
}: {
  label: string;
  title: string;
  destructive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card/90 text-muted-foreground shadow-sm transition-colors",
        destructive
          ? "hover:border-destructive/45 hover:bg-destructive/10 hover:text-destructive"
          : "hover:border-primary/35 hover:bg-primary/10 hover:text-primary"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function NumberInput({
  ariaLabel,
  value,
  onValueChange,
  onCommit,
  canEdit,
}: {
  ariaLabel: string;
  value: number;
  onValueChange: (value: number) => void;
  onCommit: (value: number) => void;
  canEdit: boolean;
}) {
  const [draft, setDraft] = useState(String(value));

  if (!canEdit) {
    return <div className="flex h-10 items-center text-sm font-semibold text-foreground">{value}</div>;
  }

  function normalize(next: string) {
    if (next.trim() === "") return 0;
    const parsed = parseInt(next, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function commit(nextRaw: string) {
    const nextValue = normalize(nextRaw);
    setDraft(String(nextValue));
    onValueChange(nextValue);
    if (nextValue !== value) {
      onCommit(nextValue);
    }
  }

  return (
    <input
      aria-label={ariaLabel}
      type="number"
      min={0}
      value={draft}
      onChange={(e) => {
        const nextRaw = e.target.value;
        setDraft(nextRaw);
        onValueChange(normalize(nextRaw));
      }}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit(e.currentTarget.value);
          e.currentTarget.blur();
        }
      }}
      className="h-10 w-full min-w-0 rounded-xl border border-input/80 bg-background/90 px-3 text-right text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}
