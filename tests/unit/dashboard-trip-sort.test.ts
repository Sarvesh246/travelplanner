import { describe, expect, it } from "vitest";
import {
  parseDashboardTripSort,
  sortDashboardMemberships,
  DEFAULT_DASHBOARD_TRIP_SORT,
} from "@/lib/dashboard-trip-sort";

type Membership = {
  trip: {
    id: string;
    name: string;
    status: string;
    startDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

const trip = (overrides: Partial<Membership["trip"]>): Membership => ({
  trip: {
    id: "t1",
    name: "Trip",
    status: "PLANNING",
    startDate: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  },
});

describe("parseDashboardTripSort", () => {
  it("returns the default for undefined", () => {
    expect(parseDashboardTripSort(undefined)).toBe(DEFAULT_DASHBOARD_TRIP_SORT);
  });

  it("returns the default for unknown values", () => {
    expect(parseDashboardTripSort("garbage")).toBe(DEFAULT_DASHBOARD_TRIP_SORT);
  });

  it("passes through valid values", () => {
    expect(parseDashboardTripSort("name_asc")).toBe("name_asc");
    expect(parseDashboardTripSort("status_desc")).toBe("status_desc");
  });
});

describe("sortDashboardMemberships", () => {
  it("does not mutate the input array", () => {
    const items = [trip({ id: "a" }), trip({ id: "b" })];
    const before = items.map((m) => m.trip.id);
    sortDashboardMemberships(items, "name_desc");
    expect(items.map((m) => m.trip.id)).toEqual(before);
  });

  it("sorts updated_desc by most recent first", () => {
    const items = [
      trip({ id: "old", updatedAt: new Date("2026-01-01") }),
      trip({ id: "new", updatedAt: new Date("2026-04-27") }),
    ];
    const sorted = sortDashboardMemberships(items, "updated_desc");
    expect(sorted[0].trip.id).toBe("new");
    expect(sorted[1].trip.id).toBe("old");
  });

  it("sorts name_asc case-insensitively", () => {
    const items = [
      trip({ id: "1", name: "banana" }),
      trip({ id: "2", name: "Apple" }),
      trip({ id: "3", name: "cherry" }),
    ];
    const sorted = sortDashboardMemberships(items, "name_asc");
    expect(sorted.map((m) => m.trip.name)).toEqual(["Apple", "banana", "cherry"]);
  });

  it("places null startDate after dated trips when ascending", () => {
    const items = [
      trip({ id: "1", startDate: null }),
      trip({ id: "2", startDate: new Date("2026-06-01") }),
    ];
    const sorted = sortDashboardMemberships(items, "start_asc");
    expect(sorted[0].trip.id).toBe("2");
    expect(sorted[1].trip.id).toBe("1");
  });

  it("places null startDate after dated trips when descending too", () => {
    const items = [
      trip({ id: "1", startDate: null }),
      trip({ id: "2", startDate: new Date("2026-06-01") }),
    ];
    const sorted = sortDashboardMemberships(items, "start_desc");
    expect(sorted[0].trip.id).toBe("2");
    expect(sorted[1].trip.id).toBe("1");
  });

  it("ties break by name then id", () => {
    const stamp = new Date("2026-01-01");
    const items = [
      trip({ id: "z-id", name: "Same", updatedAt: stamp }),
      trip({ id: "a-id", name: "Same", updatedAt: stamp }),
    ];
    const sorted = sortDashboardMemberships(items, "updated_desc");
    expect(sorted.map((m) => m.trip.id)).toEqual(["a-id", "z-id"]);
  });
});
