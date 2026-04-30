"use client";

import { formatDate } from "@/lib/utils";
import { ActivityRow } from "./ActivityRow";
import type { ActivitySerialized } from "./types";

interface DayTimelineProps {
  activities: ActivitySerialized[];
  canEdit: boolean;
}

export function DayTimeline({ activities, canEdit }: DayTimelineProps) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">No activities yet.</p>;
  }

  const groups = groupByDay(activities);

  return (
    <div className="space-y-5">
      {groups.map(([dayKey, items]) => (
        <section key={dayKey}>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            {dayKey === "unscheduled" ? "Unscheduled" : formatDate(dayKey, { weekday: "long", month: "short", day: "numeric" })}
          </h4>
          <div className="space-y-1.5 border-l-2 border-border/60 pl-4 ml-1 relative">
            {items.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} canEdit={canEdit} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupByDay(activities: ActivitySerialized[]): [string, ActivitySerialized[]][] {
  const map = new Map<string, ActivitySerialized[]>();
  for (const a of activities) {
    const key = a.scheduledDate ? a.scheduledDate.slice(0, 10) : "unscheduled";
    const arr = map.get(key) ?? [];
    arr.push(a);
    map.set(key, arr);
  }
  const entries = Array.from(map.entries());
  entries.sort(([a], [b]) => {
    if (a === "unscheduled") return 1;
    if (b === "unscheduled") return -1;
    return a.localeCompare(b);
  });
  for (const [, items] of entries) {
    items.sort((a, b) => {
      const ta = a.startTime ?? "99:99";
      const tb = b.startTime ?? "99:99";
      return ta.localeCompare(tb);
    });
  }
  return entries;
}
