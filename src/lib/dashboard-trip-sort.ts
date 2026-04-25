import { TRIP_STATUS_OPTIONS } from "@/lib/constants";

export const DASHBOARD_TRIP_SORT_OPTIONS = [
  { value: "updated_desc", label: "Recently updated" },
  { value: "created_desc", label: "Recently created" },
  { value: "start_asc", label: "Start date (earliest)" },
  { value: "start_desc", label: "Start date (latest)" },
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
  { value: "status_asc", label: "Status (ascending)" },
  { value: "status_desc", label: "Status (descending)" },
] as const;

export type DashboardTripSort = (typeof DASHBOARD_TRIP_SORT_OPTIONS)[number]["value"];

const SORT_VALUES = new Set<string>(DASHBOARD_TRIP_SORT_OPTIONS.map((o) => o.value));

export const DEFAULT_DASHBOARD_TRIP_SORT: DashboardTripSort = "updated_desc";

export function parseDashboardTripSort(raw: string | undefined): DashboardTripSort {
  if (raw && SORT_VALUES.has(raw)) return raw as DashboardTripSort;
  return DEFAULT_DASHBOARD_TRIP_SORT;
}

function statusIndex(status: string): number {
  const i = TRIP_STATUS_OPTIONS.findIndex((o) => o.value === status);
  return i < 0 ? 999 : i;
}

function compareStartDate(a: Date | null, b: Date | null, dir: "asc" | "desc"): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  const diff = a.getTime() - b.getTime();
  return dir === "asc" ? diff : -diff;
}

type SortableMembership = {
  trip: {
    id: string;
    name: string;
    status: string;
    startDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

function tieBreak(a: SortableMembership, b: SortableMembership): number {
  return (
    a.trip.name.localeCompare(b.trip.name, undefined, { sensitivity: "base" }) ||
    a.trip.id.localeCompare(b.trip.id)
  );
}

/**
 * Sort dashboard trip memberships in place (returns a new array). Tie-break: name, then id.
 */
export function sortDashboardMemberships<T extends SortableMembership>(memberships: T[], sort: DashboardTripSort): T[] {
  const out = [...memberships];
  out.sort((a, b) => {
    const ta = a.trip;
    const tb = b.trip;
    let c = 0;
    switch (sort) {
      case "updated_desc":
        c = tb.updatedAt.getTime() - ta.updatedAt.getTime();
        break;
      case "created_desc":
        c = tb.createdAt.getTime() - ta.createdAt.getTime();
        break;
      case "start_asc":
        c = compareStartDate(ta.startDate, tb.startDate, "asc");
        break;
      case "start_desc":
        c = compareStartDate(ta.startDate, tb.startDate, "desc");
        break;
      case "name_asc":
        c = ta.name.localeCompare(tb.name, undefined, { sensitivity: "base" });
        break;
      case "name_desc":
        c = tb.name.localeCompare(ta.name, undefined, { sensitivity: "base" });
        break;
      case "status_asc":
        c = statusIndex(ta.status) - statusIndex(tb.status);
        break;
      case "status_desc":
        c = statusIndex(tb.status) - statusIndex(ta.status);
        break;
      default:
        c = 0;
    }
    if (c !== 0) return c;
    return tieBreak(a, b);
  });
  return out;
}
