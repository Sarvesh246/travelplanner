"use client";

import { useState } from "react";
import { CalendarDays, WalletCards } from "lucide-react";
import { InlineEdit } from "@/components/shared/InlineEdit";
import { useTripContext } from "@/components/trip/TripContext";
import { updateTrip } from "@/actions/trips";
import { formatCurrency, formatDateRange } from "@/lib/utils";

export function OverviewHeroEditor({
  tripId,
  name,
  startDate,
  endDate,
  estimatedCost,
  automaticCost,
  hasManualEstimate,
  currency,
}: {
  tripId: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  estimatedCost: number;
  automaticCost: number;
  hasManualEstimate: boolean;
  currency: string;
}) {
  const [localStart, setLocalStart] = useState(startDate ?? "");
  const [localEnd, setLocalEnd] = useState(endDate ?? "");
  const { canManage } = useTripContext();

  function saveManualEstimate(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      void updateTrip(tripId, { estimatedCostOverride: null });
      return;
    }

    const parsed = Number(trimmed.replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    void updateTrip(tripId, { estimatedCostOverride: parsed });
  }

  return (
    <div className="space-y-3">
      <InlineEdit
        value={name}
        onSave={async (next) => {
          await updateTrip(tripId, { name: next });
        }}
        canEdit={canManage}
        showEditIcon={canManage}
        editLabel="Edit trip name"
        displayClassName="min-w-0 text-balance text-2xl font-bold tracking-tight"
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-xl border border-border/75 bg-card/70 px-3 py-2 text-sm">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={localStart}
            onChange={(e) => {
              const next = e.target.value;
              setLocalStart(next);
              void updateTrip(tripId, { startDate: next || null });
            }}
            className="w-full bg-transparent outline-none"
          />
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-border/75 bg-card/70 px-3 py-2 text-sm">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={localEnd}
            min={localStart || undefined}
            onChange={(e) => {
              const next = e.target.value;
              setLocalEnd(next);
              void updateTrip(tripId, { endDate: next || null });
            }}
            className="w-full bg-transparent outline-none"
          />
        </label>
      </div>

      <div className="flex w-full max-w-xs min-w-0 items-center gap-2 rounded-xl border border-border/75 bg-card/70 px-3 py-2 text-sm">
        <WalletCards className="h-4 w-4 shrink-0 text-muted-foreground" />
        <label className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Estimated cost
          </span>
          <span className="mt-0.5 flex min-w-0 items-baseline gap-2">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">{currency}</span>
            {canManage ? (
              <input
                key={`${estimatedCost}:${hasManualEstimate}`}
                type="text"
                inputMode="decimal"
                defaultValue={estimatedCost.toString()}
                onBlur={(e) => saveManualEstimate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") {
                    e.currentTarget.value = estimatedCost.toString();
                    e.currentTarget.blur();
                  }
                }}
                className="min-w-0 flex-1 bg-transparent text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Estimated trip cost"
              />
            ) : (
              <span className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
                {formatCurrency(estimatedCost, currency)}
              </span>
            )}
          </span>
        </label>
        {canManage && hasManualEstimate ? (
          <button
            type="button"
            onClick={() => {
              void updateTrip(tripId, { estimatedCostOverride: null });
            }}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <span className="hidden min-[360px]:inline">Use auto</span>
            <span className="min-[360px]:hidden">Auto</span>
          </button>
        ) : null}
      </div>
      <p className="-mt-1 max-w-xs text-xs text-muted-foreground">
        {hasManualEstimate
          ? `Manual estimate. Auto total is ${formatCurrency(automaticCost, currency)}.`
          : "Auto-calculated from expenses and supplies. Edit it if you need a different estimate."}
      </p>

      <p className="text-sm text-muted-foreground">
        {localStart || localEnd
          ? formatDateRange(localStart || null, localEnd || null)
          : "Set dates to frame the itinerary"}
      </p>
    </div>
  );
}
