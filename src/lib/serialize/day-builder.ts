import { ROUTES } from "@/lib/constants";
import { formatDate, formatTimeRange, formatTimeValue } from "@/lib/utils";
import type { DayPlan, DayPlanItem, StopSerialized, StopDetailTab } from "@/components/itinerary/types";
import {
  compareDateKeys,
  dateKeyFromDateLike,
} from "@/lib/dates/date-key";

function toDateKey(value: string | null | undefined) {
  return dateKeyFromDateLike(value);
}

function enumerateDateKeys(startKey: string, endKey: string) {
  const [startYear, startMonth, startDay] = startKey.split("-").map(Number);
  const [endYear, endMonth, endDay] = endKey.split("-").map(Number);
  const start = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  const end = new Date(Date.UTC(endYear, endMonth - 1, endDay));
  const keys: string[] = [];

  while (start <= end) {
    const year = start.getUTCFullYear();
    const month = `${start.getUTCMonth() + 1}`.padStart(2, "0");
    const day = `${start.getUTCDate()}`.padStart(2, "0");
    keys.push(`${year}-${month}-${day}`);
    start.setUTCDate(start.getUTCDate() + 1);
  }

  return keys;
}

function pushItem(map: Map<string, Array<DayPlanItem & { _order: [number, string, number, string] }>>, date: string, item: DayPlanItem & { _order: [number, string, number, string] }) {
  const current = map.get(date) ?? [];
  current.push(item);
  map.set(date, current);
}

function itemPriority(kind: DayPlanItem["kind"]) {
  switch (kind) {
    case "stop-arrival":
    case "stop-departure":
      return 1;
    case "stay":
      return 2;
    case "activity":
      return 3;
    default:
      return 4;
  }
}

function timeOrderValue(timeLabel: string | null, fallback: string) {
  return timeLabel ? fallback : "99:99";
}

function stopTargetTab(stop: StopSerialized): StopDetailTab {
  if (stop.stays.length > 0) return "stays";
  return "activities";
}

export function buildDayPlans(tripId: string, stops: StopSerialized[]): DayPlan[] {
  const dayMap = new Map<string, Array<DayPlanItem & { _order: [number, string, number, string] }>>();

  for (const stop of stops) {
    const defaultTab = stopTargetTab(stop);
    const stopHref = `${ROUTES.tripStop(tripId, stop.id)}?tab=${defaultTab}`;
    const arrivalKey = toDateKey(stop.arrivalDate);
    const departureKey = toDateKey(stop.departureDate);

    if (arrivalKey) {
      pushItem(dayMap, arrivalKey, {
        id: `stop-arrival:${stop.id}:${arrivalKey}`,
        kind: "stop-arrival",
        sourceId: stop.id,
        stopId: stop.id,
        stopName: stop.name,
        date: arrivalKey,
        title: `Arrive in ${stop.name}`,
        subtitle: stop.country,
        timeLabel: null,
        href: stopHref,
        targetTab: defaultTab,
        _order: [itemPriority("stop-arrival"), "99:99", stop.sortOrder, `a:${stop.id}`],
      });
    }

    if (departureKey) {
      pushItem(dayMap, departureKey, {
        id: `stop-departure:${stop.id}:${departureKey}`,
        kind: "stop-departure",
        sourceId: stop.id,
        stopId: stop.id,
        stopName: stop.name,
        date: departureKey,
        title: `Leave ${stop.name}`,
        subtitle: stop.country,
        timeLabel: null,
        href: stopHref,
        targetTab: defaultTab,
        _order: [itemPriority("stop-departure"), "99:99", stop.sortOrder, `d:${stop.id}`],
      });
    }

    for (const stay of stop.stays) {
      const checkInKey = toDateKey(stay.checkIn);
      const checkOutKey = toDateKey(stay.checkOut);
      const stayDates =
        checkInKey && checkOutKey
          ? enumerateDateKeys(checkInKey, checkOutKey)
          : [checkInKey ?? checkOutKey].filter((value): value is string => Boolean(value));

      for (const dateKey of stayDates) {
        const phase =
          checkInKey && checkOutKey
            ? checkInKey === checkOutKey
              ? "single"
              : dateKey === checkInKey
                ? "start"
                : dateKey === checkOutKey
                  ? "end"
                  : "middle"
            : "single";

        const startTime = stay.checkInTime ?? stay.arrivalTime;
        const endTime = stay.checkOutTime ?? stay.leaveTime;
        const timeLabel =
          phase === "single" && checkInKey && checkOutKey && checkInKey === checkOutKey
            ? formatTimeRange(startTime, endTime) ?? formatTimeValue(startTime) ?? formatTimeValue(endTime)
            : phase === "start"
              ? formatTimeValue(startTime)
              : phase === "end"
                ? formatTimeValue(endTime)
                : null;

        const subtitle =
          phase === "single" && checkInKey && checkOutKey && checkInKey === checkOutKey
            ? "Check-in / check-out day"
            : phase === "middle"
            ? "Overnight stay"
            : phase === "end"
              ? "Check-out / leave day"
              : "Check-in / arrival day";

        const orderTime =
          phase === "single"
            ? (startTime ?? endTime ?? "")
            : phase === "start"
              ? (startTime ?? "")
            : phase === "end"
              ? (endTime ?? "")
              : "";

        pushItem(dayMap, dateKey, {
          id: `stay:${stay.id}:${dateKey}`,
          kind: "stay",
          sourceId: stay.id,
          stopId: stop.id,
          stopName: stop.name,
          date: dateKey,
          title: stay.name,
          subtitle,
          timeLabel,
          href: `${ROUTES.tripStop(tripId, stop.id)}?tab=stays`,
          targetTab: "stays",
          status: stay.status,
          phase,
          _order: [itemPriority("stay"), timeOrderValue(timeLabel, orderTime), stop.sortOrder, `s:${stay.id}`],
        });
      }
    }

    for (const activity of stop.activities) {
      const activityDate = toDateKey(activity.scheduledDate);
      if (!activityDate) continue;

      const timeLabel = formatTimeRange(activity.startTime, activity.endTime);
      pushItem(dayMap, activityDate, {
        id: `activity:${activity.id}:${activityDate}`,
        kind: "activity",
        sourceId: activity.id,
        stopId: stop.id,
        stopName: stop.name,
        date: activityDate,
        title: activity.name,
        subtitle: activity.description,
        timeLabel,
        href: `${ROUTES.tripStop(tripId, stop.id)}?tab=activities`,
        targetTab: "activities",
        status: activity.status,
        _order: [
          itemPriority("activity"),
          timeOrderValue(timeLabel, activity.startTime ?? ""),
          stop.sortOrder,
          `a:${activity.sortOrder}:${activity.id}`,
        ],
      });
    }
  }

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => compareDateKeys(a, b))
    .map(([date, items]) => {
      items.sort((a, b) => {
        const [aPriority, aTime, aStopOrder, aTie] = a._order;
        const [bPriority, bTime, bStopOrder, bTie] = b._order;
        return (
          aTime.localeCompare(bTime) ||
          aPriority - bPriority ||
          aStopOrder - bStopOrder ||
          aTie.localeCompare(bTie)
        );
      });

      return {
        date,
        label: formatDate(date, { weekday: "long", month: "short", day: "numeric" }),
        items: items.map((item) => {
          const { _order, ...nextItem } = item;
          void _order;
          return nextItem;
        }),
        counts: {
          stops: items.filter((item) => item.kind === "stop-arrival" || item.kind === "stop-departure").length,
          stays: items.filter((item) => item.kind === "stay").length,
          activities: items.filter((item) => item.kind === "activity").length,
        },
      } satisfies DayPlan;
    });
}
