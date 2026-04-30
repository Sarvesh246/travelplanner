"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, ChevronRight, Hotel, MapPin, Route } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACTIVITY_STATUS_COLORS, ACTIVITY_STATUS_LABELS, STAY_STATUS_COLORS } from "@/lib/constants";
import type { DayPlan, DayPlanItem, StopDetailTab } from "./types";

interface DayBuilderViewProps {
  days: DayPlan[];
  selectedStopId?: string | null;
  onOpenItem: (item: DayPlanItem) => void;
}

function itemIcon(kind: DayPlanItem["kind"]) {
  switch (kind) {
    case "stop-arrival":
    case "stop-departure":
      return <Route className="h-4 w-4" />;
    case "stay":
      return <Hotel className="h-4 w-4" />;
    case "activity":
      return <CalendarDays className="h-4 w-4" />;
  }
}

function itemStatusClass(item: DayPlanItem) {
  if (item.kind === "activity") return ACTIVITY_STATUS_COLORS[item.status];
  if (item.kind === "stay") return STAY_STATUS_COLORS[item.status];
  return "bg-muted text-muted-foreground";
}

function itemStatusLabel(item: DayPlanItem) {
  if (item.kind === "activity") return ACTIVITY_STATUS_LABELS[item.status];
  if (item.kind === "stay") return item.status;
  return item.kind === "stop-arrival" ? "Arrival" : "Departure";
}

function targetLabel(tab: StopDetailTab) {
  return tab === "activities" ? "Activities" : "Stays";
}

export function DayBuilderView({ days, selectedStopId, onOpenItem }: DayBuilderViewProps) {
  if (days.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 px-4 py-6 text-sm text-muted-foreground">
        Add dates to stops, stays, or activities to build a day-by-day sequence.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {days.map((day) => (
        <section key={day.date} className="border-b border-border/70 pb-5 last:border-b-0 last:pb-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">{day.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {day.counts.stops > 0 ? `${day.counts.stops} stop event${day.counts.stops !== 1 ? "s" : ""}` : "No stop events"}
                {" • "}
                {day.counts.stays} stay{day.counts.stays !== 1 ? "s" : ""}
                {" • "}
                {day.counts.activities} activit{day.counts.activities !== 1 ? "ies" : "y"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {day.counts.stays > 0 && (
                <span className="rounded-full border border-border/70 px-2 py-1">{day.counts.stays} stays</span>
              )}
              {day.counts.activities > 0 && (
                <span className="rounded-full border border-border/70 px-2 py-1">{day.counts.activities} activities</span>
              )}
            </div>
          </div>

          <div className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-card/30">
            {day.items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-2 px-3 py-3 transition-colors hover:bg-muted/35",
                  selectedStopId === item.stopId && "bg-primary/5"
                )}
              >
                <button
                  type="button"
                  onClick={() => onOpenItem(item)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title={`Open ${item.stopName} ${targetLabel(item.targetTab).toLowerCase()}`}
                >
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {itemIcon(item.kind)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                          itemStatusClass(item)
                        )}
                      >
                        {itemStatusLabel(item)}
                      </span>
                      {item.timeLabel && <span className="text-xs text-muted-foreground">{item.timeLabel}</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.stopName}
                      </span>
                      {item.subtitle && <span className="min-w-0 flex-1">{item.subtitle}</span>}
                    </div>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
                <Link
                  href={item.href}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title={`Open ${item.stopName} on its own page`}
                  aria-label={`Open ${item.stopName} on its own page`}
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
