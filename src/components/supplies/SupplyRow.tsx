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
          "rounded-2xl px-4 py-4 transition-colors xl:rounded-none xl:px-4 xl:py-3",
          selected && "bg-primary/5"
        )}
      >
        <div className="flex items-start gap-3 xl:hidden">
          <input
            type="checkbox"
            checked={bulkSelected}
            onChange={() => onToggleBulk?.()}
            aria-label={`Select ${item.name}`}
            className="mt-1 h-4 w-4 shrink-0 rounded border-input"
          />
          <div className="min-w-0 flex-1">
            <button type="button" onClick={onSelect} className="min-w-0 text-left">
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                    SUPPLY_STATUS_COLORS[item.status] === "text-success"
                      ? "[background-color:hsl(var(--success))]"
                      : SUPPLY_STATUS_COLORS[item.status] === "text-warning"
                        ? "[background-color:hsl(var(--warning))]"
                        : SUPPLY_STATUS_COLORS[item.status] === "text-destructive"
                          ? "[background-color:hsl(var(--destructive))]"
                          : "bg-muted-foreground"
                  )}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className={cn("mt-0.5 text-xs", SUPPLY_STATUS_COLORS[item.status])}>
                    {item.status.replace("_", " ")}
                  </p>
                </div>
              </div>
            </button>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FieldBlock label="Needed">
                <NumberInput value={item.quantityNeeded} onChange={(v) => updateQty("quantityNeeded", v)} canEdit={canEdit} />
              </FieldBlock>
              <FieldBlock label="Owned">
                <NumberInput value={item.quantityOwned} onChange={(v) => updateQty("quantityOwned", v)} canEdit={canEdit} />
              </FieldBlock>
              <FieldBlock label="Est. cost">
                <span className="text-sm font-medium">
                  {totalEstimatedCost !== null ? formatCurrency(totalEstimatedCost, currency) : "—"}
                </span>
              </FieldBlock>
              <FieldBlock label="Each">
                <span className="text-sm font-medium">
                  {item.estimatedCost !== null ? formatCurrency(item.estimatedCost, currency) : "—"}
                </span>
              </FieldBlock>
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Bringer
                </div>
                {canEdit ? (
                  <select
                    value={item.whoBringsId ?? ""}
                    onChange={(e) => updateBringer(e.target.value || null)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.user.name}
                      </option>
                    ))}
                  </select>
                ) : item.whoBrings ? (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-muted/45 px-2.5 py-2 text-sm">
                    <UserAvatar name={item.whoBrings.name} avatarUrl={item.whoBrings.avatarUrl} size="xs" />
                    <span className="truncate">{item.whoBrings.name}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                )}
              </div>

              {canEdit ? (
                <div className="flex items-center justify-end gap-2">
                  <InlineActionButton
                    label={`Copy trip link for ${item.name}`}
                    title="Copy link"
                    onClick={(e) => void copySupplyDeepLink(e)}
                  >
                    <Link2 className="h-4 w-4" />
                  </InlineActionButton>
                  {item.status !== "COVERED" && (
                    <InlineActionButton
                      label={`Mark ${item.name} as covered`}
                      title="Mark covered"
                      onClick={() => void handleMarkBought()}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </InlineActionButton>
                  )}
                  <InlineActionButton
                    label={`Delete ${item.name}`}
                    title="Delete item"
                    destructive
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </InlineActionButton>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="hidden xl:grid xl:grid-cols-[auto_minmax(0,1.4fr)_5rem_5rem_7rem_minmax(11rem,1fr)_8rem] xl:items-center xl:gap-4">
          <div className="flex justify-center">
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

          <div className="text-right">
            <NumberInput value={item.quantityNeeded} onChange={(v) => updateQty("quantityNeeded", v)} canEdit={canEdit} />
          </div>
          <div className="text-right">
            <NumberInput value={item.quantityOwned} onChange={(v) => updateQty("quantityOwned", v)} canEdit={canEdit} />
          </div>
          <div className="text-right text-sm text-muted-foreground">
            {totalEstimatedCost !== null ? formatCurrency(totalEstimatedCost, currency) : "—"}
          </div>

          <div className="min-w-0">
            {canEdit ? (
              <select
                value={item.whoBringsId ?? ""}
                onChange={(e) => updateBringer(e.target.value || null)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            ) : item.whoBrings ? (
              <div className="inline-flex items-center gap-2 rounded-lg bg-muted/45 px-2.5 py-2 text-sm">
                <UserAvatar name={item.whoBrings.name} avatarUrl={item.whoBrings.avatarUrl} size="xs" />
                <span className="truncate">{item.whoBrings.name}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Unassigned</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <InlineActionButton
              label={`Copy trip link for ${item.name}`}
              title="Copy link"
              onClick={(e) => void copySupplyDeepLink(e)}
            >
              <Link2 className="h-4 w-4" />
            </InlineActionButton>
            {item.status !== "COVERED" && (
              <InlineActionButton
                label={`Mark ${item.name} as covered`}
                title="Mark covered"
                onClick={() => void handleMarkBought()}
              >
                <CheckCircle2 className="h-4 w-4" />
              </InlineActionButton>
            )}
            <div className="relative z-[6]">
              <InlineActionButton
                label="More options"
                title="More options"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </InlineActionButton>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-xl border border-border bg-popover py-1 shadow-lg">
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

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function InlineActionButton({
  label,
  title,
  destructive = false,
  onClick,
  children,
}: {
  label: string;
  title: string;
  destructive?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
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
      className="w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}
