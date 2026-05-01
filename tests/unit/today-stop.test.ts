import { describe, expect, it, vi } from "vitest";
import { findRelevantStopForToday } from "@/lib/itinerary/today-stop";
import type { StopSerialized } from "@/components/itinerary/types";
import { StopStatus } from "@prisma/client";

function makeStop(overrides: Partial<StopSerialized>): StopSerialized {
  return {
    id: "stop-1",
    name: "Stop",
    country: null,
    description: null,
    latitude: null,
    longitude: null,
    placeId: null,
    sortOrder: 0,
    arrivalDate: null,
    departureDate: null,
    status: StopStatus.DRAFT,
    stays: [],
    activities: [],
    ...overrides,
  };
}

describe("findRelevantStopForToday", () => {
  it("prefers the stop whose range contains today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-06T09:00:00.000-05:00"));

    const stopId = findRelevantStopForToday([
      makeStop({
        id: "future",
        arrivalDate: "2026-07-07T00:00:00.000Z",
        departureDate: "2026-07-09T00:00:00.000Z",
      }),
      makeStop({
        id: "current",
        arrivalDate: "2026-07-05T00:00:00.000Z",
        departureDate: "2026-07-06T00:00:00.000Z",
      }),
    ]);

    expect(stopId).toBe("current");
    vi.useRealTimers();
  });

  it("falls back to the earliest future arrival, then the earliest arrival overall", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-06T09:00:00.000-05:00"));

    expect(
      findRelevantStopForToday([
        makeStop({ id: "later", arrivalDate: "2026-07-08T00:00:00.000Z" }),
        makeStop({ id: "next", arrivalDate: "2026-07-07T00:00:00.000Z" }),
      ])
    ).toBe("next");

    expect(
      findRelevantStopForToday([
        makeStop({ id: "past-2", arrivalDate: "2026-07-03T00:00:00.000Z" }),
        makeStop({ id: "past-1", arrivalDate: "2026-07-01T00:00:00.000Z" }),
      ])
    ).toBe("past-1");

    vi.useRealTimers();
  });
});
