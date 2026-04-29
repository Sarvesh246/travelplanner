"use client";

import { useState } from "react";
import { CalendarDays, WalletCards } from "lucide-react";
import { InlineEdit } from "@/components/shared/InlineEdit";
import { useTripContext } from "@/components/trip/TripContext";
import { updateTrip } from "@/actions/trips";
import { formatDateRange } from "@/lib/utils";

export function OverviewHeroEditor({
  tripId,
  name,
  startDate,
  endDate,
  budgetTarget,
  currency,
}: {
  tripId: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  budgetTarget: number | null;
  currency: string;
}) {
  const [localStart, setLocalStart] = useState(startDate ?? "");
  const [localEnd, setLocalEnd] = useState(endDate ?? "");
  const [localBudget, setLocalBudget] = useState(budgetTarget?.toString() ?? "");
  const { canManage } = useTripContext();

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

      <label className="flex max-w-xs items-center gap-2 rounded-xl border border-border/75 bg-card/70 px-3 py-2 text-sm">
        <WalletCards className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{currency}</span>
        <input
          type="number"
          value={localBudget}
          onChange={(e) => setLocalBudget(e.target.value)}
          onBlur={() => {
            const parsed = Number(localBudget);
            void updateTrip(tripId, { budgetTarget: Number.isFinite(parsed) ? parsed : 0 });
          }}
          className="w-full bg-transparent outline-none"
          placeholder="Budget target"
        />
      </label>

      <p className="text-sm text-muted-foreground">
        {localStart || localEnd
          ? formatDateRange(localStart ? new Date(localStart) : null, localEnd ? new Date(localEnd) : null)
          : "Set dates to frame the itinerary"}
      </p>
    </div>
  );
}
