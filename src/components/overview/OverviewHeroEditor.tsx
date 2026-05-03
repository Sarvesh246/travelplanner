"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Users, WalletCards } from "lucide-react";
import {
  useTripEditingPresenceField,
} from "@/components/collaboration/TripEditingPresenceProvider";
import { EditingPresenceNotice } from "@/components/collaboration/EditingPresenceNotice";
import { addDays } from "date-fns/addDays";
import { nextSaturday } from "date-fns/nextSaturday";
import { InlineEdit } from "@/components/shared/InlineEdit";
import { useTripContext } from "@/components/trip/TripContext";
import { updateTrip } from "@/actions/trips";
import { formatCurrency, getStandardTimeZoneLabel } from "@/lib/utils";

export function OverviewHeroEditor({
  tripId,
  name,
  startDate,
  endDate,
}: {
  tripId: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  currency: string;
}) {
  const router = useRouter();
  const [localStart, setLocalStart] = useState(startDate ?? "");
  const [localEnd, setLocalEnd] = useState(endDate ?? "");
  const { canManage } = useTripContext();
  const startDatePresence = useTripEditingPresenceField({
    surfaceId: `trip-overview:${tripId}`,
    surfaceLabel: "Trip overview",
    resourceId: tripId,
    resourceLabel: "Trip overview",
    fieldKey: "start-date",
    fieldLabel: "start date",
  });
  const endDatePresence = useTripEditingPresenceField({
    surfaceId: `trip-overview:${tripId}`,
    surfaceLabel: "Trip overview",
    resourceId: tripId,
    resourceLabel: "Trip overview",
    fieldKey: "end-date",
    fieldLabel: "end date",
  });

  const tzLabel = useMemo(() => {
    return getStandardTimeZoneLabel();
  }, []);

  async function applyQuickRange(kind: "weekend7" | "plusWeek") {
    const now = new Date();
    let startStr: string;
    let endStr: string;
    if (kind === "weekend7") {
      const sat = nextSaturday(now);
      const sun = addDays(sat, 1);
      startStr = sat.toISOString().slice(0, 10);
      endStr = sun.toISOString().slice(0, 10);
    } else {
      const anchor = localStart ? new Date(localStart + "T12:00:00") : now;
      const s = addDays(anchor, 7);
      const e = localEnd ? addDays(new Date(localEnd + "T12:00:00"), 7) : addDays(s, 3);
      startStr = s.toISOString().slice(0, 10);
      endStr = e.toISOString().slice(0, 10);
    }
    setLocalStart(startStr);
    setLocalEnd(endStr);
    await updateTrip(tripId, { startDate: startStr, endDate: endStr });
    router.refresh();
  }

  return (
    <div className="space-y-3" id="trip-dates">
      <InlineEdit
        value={name}
        onSave={async (next) => {
          await updateTrip(tripId, { name: next });
        }}
        canEdit={canManage}
        showEditIcon={canManage}
        editLabel="Edit trip name"
        displayClassName="min-w-0 text-balance text-2xl font-bold tracking-tight"
        presence={{
          surfaceId: `trip-overview:${tripId}`,
          surfaceLabel: "Trip overview",
          resourceId: tripId,
          resourceLabel: "Trip overview",
          fieldKey: "trip-name",
          fieldLabel: "trip name",
        }}
      />

      {tzLabel ? (
        <p className="text-[11px] text-muted-foreground">
          Dates render in{" "}
          <span className="font-semibold uppercase tracking-[0.14em] text-foreground">{tzLabel}</span> — members
          in other zones see aligned calendar days rather than simultaneous local midnight.
        </p>
      ) : null}

      {canManage && (
        <div className="-mt-1 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-border/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors duration-300 hover:bg-primary/15 hover:border-primary/35 hover:text-primary"
            onClick={() => void applyQuickRange("weekend7")}
          >
            Next Sat–Sun
          </button>
          <button
            type="button"
            className="rounded-full border border-border/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors duration-300 hover:bg-primary/15 hover:border-primary/35 hover:text-primary"
            onClick={() => void applyQuickRange("plusWeek")}
          >
            Dates + one week
          </button>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="flex items-center gap-2 rounded-xl border border-border/75 bg-card/70 px-3 py-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={localStart}
              onChange={(e) => {
                const next = e.target.value;
                setLocalStart(next);
                startDatePresence.activate();
                void (async () => {
                  await updateTrip(tripId, { startDate: next || null });
                  router.refresh();
                })();
              }}
              onFocus={startDatePresence.activate}
              onBlur={startDatePresence.clear}
              className="w-full bg-transparent outline-none"
            />
          </label>
          <EditingPresenceNotice editors={startDatePresence.fieldEditors} />
        </div>
        <div>
          <label className="flex items-center gap-2 rounded-xl border border-border/75 bg-card/70 px-3 py-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={localEnd}
              min={localStart || undefined}
              onChange={(e) => {
                const next = e.target.value;
                setLocalEnd(next);
                endDatePresence.activate();
                void (async () => {
                  await updateTrip(tripId, { endDate: next || null });
                  router.refresh();
                })();
              }}
              onFocus={endDatePresence.activate}
              onBlur={endDatePresence.clear}
              className="w-full bg-transparent outline-none"
            />
          </label>
          <EditingPresenceNotice editors={endDatePresence.fieldEditors} />
        </div>
      </div>
    </div>
  );
}

/** Full-width cost row (matches overview `min-[560px]:grid-cols-2` used for departure / route length). */
export function OverviewCostPanels({
  tripId,
  currency,
  estimatedCost,
  automaticCost,
  individualCost,
  actualMemberCount,
  splitMemberCount,
  hasManualEstimate,
}: {
  tripId: string;
  currency: string;
  estimatedCost: number;
  automaticCost: number;
  individualCost: number;
  actualMemberCount: number;
  splitMemberCount: number;
  hasManualEstimate: boolean;
}) {
  const { canManage } = useTripContext();
  const [customMemberCount, setCustomMemberCount] = useState(splitMemberCount.toString());
  const [isEditingMemberCount, setIsEditingMemberCount] = useState(false);
  const estimatePresence = useTripEditingPresenceField({
    surfaceId: `trip-overview:${tripId}`,
    surfaceLabel: "Trip overview",
    resourceId: tripId,
    resourceLabel: "Trip overview",
    fieldKey: "estimated-cost",
    fieldLabel: "estimated cost",
  });

  function formatCostValue(value: number) {
    const hasCents = Math.abs(value % 1) > 0.0001;
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(value);
  }

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

  function saveSplitMemberCount(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setCustomMemberCount(actualMemberCount.toString());
      setIsEditingMemberCount(false);
      void updateTrip(tripId, { costSplitMemberCountOverride: null });
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setCustomMemberCount(splitMemberCount.toString());
      setIsEditingMemberCount(false);
      return;
    }

    setCustomMemberCount(parsed.toString());
    setIsEditingMemberCount(false);
    void updateTrip(tripId, {
      costSplitMemberCountOverride: parsed === actualMemberCount ? null : parsed,
    });
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 min-[560px]:grid-cols-2">
      <div className="min-w-0 w-full rounded-2xl border border-border/75 bg-card/70 px-4 py-3.5 sm:px-4.5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/12">
            <WalletCards className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Estimated cost
                </p>
                <div className="mt-2 flex min-w-0 items-end gap-2">
                  <span className="shrink-0 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {currency}
                  </span>
                  {canManage ? (
                    <input
                      key={`${estimatedCost}:${hasManualEstimate}`}
                      type="text"
                      inputMode="decimal"
                      defaultValue={estimatedCost.toString()}
                      onBlur={(e) => {
                        estimatePresence.clear();
                        saveManualEstimate(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") {
                          e.currentTarget.value = estimatedCost.toString();
                          e.currentTarget.blur();
                        }
                      }}
                      onFocus={estimatePresence.activate}
                      onChange={estimatePresence.activate}
                      className="min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-[2rem] font-semibold leading-none tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
                      aria-label="Estimated group trip cost"
                    />
                  ) : (
                    <span className="min-w-0 truncate text-[2rem] font-semibold leading-none tracking-tight text-foreground">
                      {formatCostValue(estimatedCost)}
                    </span>
                  )}
                </div>
              </div>
              {canManage && hasManualEstimate ? (
                <button
                  type="button"
                  onClick={() => {
                    void updateTrip(tripId, { estimatedCostOverride: null });
                  }}
                  className="shrink-0 rounded-full border border-primary/18 bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary transition-[background-color,border-color,color] duration-300 hover:border-primary/32 hover:bg-primary/12"
                >
                  Use auto
                </button>
              ) : null}
            </div>

            <p className="mt-2.5 text-xs leading-5 text-muted-foreground">
              {hasManualEstimate
                ? `Manual group estimate. Auto total is ${formatCurrency(automaticCost, currency)}.`
                : "Auto-calculated as the total group cost from expenses and supplies."}
            </p>
            <EditingPresenceNotice editors={estimatePresence.fieldEditors} className="mt-2" />
          </div>
        </div>
      </div>

      <div className="min-w-0 w-full rounded-2xl border border-border/75 bg-card/70 px-4 py-3.5 sm:px-4.5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/12">
            <Users className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Individual cost
            </p>
            <div className="mt-2 flex min-w-0 items-end gap-2">
              <span className="shrink-0 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {currency}
              </span>
              <span className="min-w-0 truncate text-[2rem] font-semibold leading-none tracking-tight text-foreground">
                {formatCostValue(individualCost)}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border/70 bg-background/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Split by {splitMemberCount} {splitMemberCount === 1 ? "person" : "people"}
              </span>
              {canManage ? (
                isEditingMemberCount ? (
                  <>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={customMemberCount}
                      onChange={(e) => setCustomMemberCount(e.target.value)}
                      onBlur={(e) => saveSplitMemberCount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") {
                          setCustomMemberCount(splitMemberCount.toString());
                          setIsEditingMemberCount(false);
                        }
                      }}
                      autoFocus
                      className="w-20 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-sm outline-none transition-colors duration-300 focus:border-primary/35"
                      aria-label="Members included in individual cost split"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomMemberCount(actualMemberCount.toString());
                        setIsEditingMemberCount(false);
                        void updateTrip(tripId, { costSplitMemberCountOverride: null });
                      }}
                      className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors duration-300 hover:border-primary/35 hover:text-primary"
                    >
                      Use roster
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMemberCount(splitMemberCount.toString());
                      setIsEditingMemberCount(true);
                    }}
                    className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors duration-300 hover:border-primary/35 hover:text-primary"
                  >
                    Adjust split
                  </button>
                )
              ) : null}
            </div>

            <p className="mt-2.5 text-xs leading-5 text-muted-foreground">
              {splitMemberCount === actualMemberCount
                ? `Based on the ${actualMemberCount} active ${actualMemberCount === 1 ? "member" : "members"} on this trip.`
                : `Using a custom split of ${splitMemberCount} people instead of the ${actualMemberCount} active ${actualMemberCount === 1 ? "member" : "members"} on the trip.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
