"use client";

import { Package, User } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { SupplyItemSerialized } from "./types";

export function SupplyDetailPanel({
  item,
  currency,
}: {
  item: SupplyItemSerialized | null;
  currency: string;
}) {
  if (!item) {
    return (
      <div className="app-surface rounded-2xl border border-border/80 p-5 text-sm text-muted-foreground">
        Select an item to view details and assignment.
      </div>
    );
  }

  const totalEstimatedCost =
    item.estimatedCost !== null ? item.estimatedCost * item.quantityNeeded : null;

  return (
    <div className="app-surface rounded-2xl border border-border/80 p-5">
      <h3 className="text-base font-semibold">{item.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{item.category ?? "Other"}</p>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Needed</span>
          <span className="font-medium">{item.quantityNeeded}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Owned</span>
          <span className="font-medium">{item.quantityOwned}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Remaining</span>
          <span className="font-medium">{item.quantityRemaining}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Estimated cost</span>
          <span className="font-medium">
            {totalEstimatedCost !== null ? formatCurrency(totalEstimatedCost, currency) : "—"}
          </span>
        </div>
        {item.estimatedCost !== null && item.quantityNeeded > 0 ? (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Each</span>
            <span>{formatCurrency(item.estimatedCost, currency)}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-5 border-t border-border/70 pt-4">
        <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          Assigned bringer
        </p>
        {item.whoBrings ? (
          <div className="inline-flex items-center gap-2 rounded-lg bg-muted/45 px-2.5 py-2 text-sm">
            <UserAvatar name={item.whoBrings.name} avatarUrl={item.whoBrings.avatarUrl} size="xs" />
            {item.whoBrings.name}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Unassigned</p>
        )}
      </div>

      {item.notes ? (
        <div className="mt-5 border-t border-border/70 pt-4">
          <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            Notes
          </p>
          <p className="text-sm text-muted-foreground">{item.notes}</p>
        </div>
      ) : null}
    </div>
  );
}
