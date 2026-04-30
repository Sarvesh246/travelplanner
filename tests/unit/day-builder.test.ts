import { ActivityStatus, StopStatus, StayStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildDayPlans } from "@/lib/serialize/day-builder";
import type { StopSerialized } from "@/components/itinerary/types";

function makeStop(overrides: Partial<StopSerialized>): StopSerialized {
  return {
    id: "stop-1",
    name: "Great Sand Dunes",
    country: "Colorado, United States",
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

describe("buildDayPlans", () => {
  it("places activities on their scheduled date and keeps untimed ones after timed items", () => {
    const days = buildDayPlans("trip-1", [
      makeStop({
        id: "stop-a",
        name: "Stop A",
        sortOrder: 0,
        activities: [
          {
            id: "activity-untimed",
            name: "Late decision",
            description: null,
            scheduledDate: "2026-07-06T00:00:00.000Z",
            startTime: null,
            endTime: null,
            durationMins: null,
            estimatedCost: null,
            actualCost: null,
            status: ActivityStatus.PLANNED,
            url: null,
            sortOrder: 5,
          },
          {
            id: "activity-timed",
            name: "Morning hike",
            description: null,
            scheduledDate: "2026-07-06T00:00:00.000Z",
            startTime: "08:30",
            endTime: "10:00",
            durationMins: 90,
            estimatedCost: null,
            actualCost: null,
            status: ActivityStatus.CONFIRMED,
            url: null,
            sortOrder: 1,
          },
        ],
      }),
    ]);

    expect(days).toHaveLength(1);
    expect(days[0]?.date).toBe("2026-07-06");
    expect(days[0]?.items.map((item) => item.sourceId)).toEqual([
      "activity-timed",
      "activity-untimed",
    ]);
  });

  it("renders multi-day stays on each covered day with start, middle, and end context", () => {
    const days = buildDayPlans("trip-1", [
      makeStop({
        stays: [
          {
            id: "stay-1",
            name: "Pinon Flats Campground",
            address: null,
            url: null,
            roomSiteNumbers: [],
            arrivalTime: null,
            checkIn: "2026-07-05T00:00:00.000Z",
            checkInTime: "15:00",
            checkOut: "2026-07-07T00:00:00.000Z",
            checkOutTime: "11:00",
            leaveTime: null,
            pricePerNight: null,
            totalPrice: null,
            status: StayStatus.BOOKED,
            notes: null,
            confirmationNo: null,
          },
        ],
      }),
    ]);

    expect(days.map((day) => day.date)).toEqual([
      "2026-07-05",
      "2026-07-06",
      "2026-07-07",
    ]);

    const phases = days.map((day) => day.items[0]);
    expect(phases[0]).toMatchObject({
      kind: "stay",
      phase: "start",
      subtitle: "Check-in / arrival day",
      timeLabel: "3:00 PM",
    });
    expect(phases[1]).toMatchObject({
      kind: "stay",
      phase: "middle",
      subtitle: "Overnight stay",
      timeLabel: null,
    });
    expect(phases[2]).toMatchObject({
      kind: "stay",
      phase: "end",
      subtitle: "Check-out / leave day",
      timeLabel: "11:00 AM",
    });
  });

  it("renders same-day stays with both edge times and combined context", () => {
    const days = buildDayPlans("trip-1", [
      makeStop({
        stays: [
          {
            id: "stay-2",
            name: "Basecamp",
            address: null,
            url: null,
            roomSiteNumbers: [],
            arrivalTime: null,
            checkIn: "2026-07-05T00:00:00.000Z",
            checkInTime: "14:00",
            checkOut: "2026-07-05T00:00:00.000Z",
            checkOutTime: "18:00",
            leaveTime: null,
            pricePerNight: null,
            totalPrice: null,
            status: StayStatus.BOOKED,
            notes: null,
            confirmationNo: null,
          },
        ],
      }),
    ]);

    expect(days).toHaveLength(1);
    expect(days[0]?.items[0]).toMatchObject({
      kind: "stay",
      phase: "single",
      subtitle: "Check-in / check-out day",
      timeLabel: "2:00 PM - 6:00 PM",
    });
  });

  it("adds stop arrival and departure markers only when dates exist", () => {
    const days = buildDayPlans("trip-1", [
      makeStop({
        id: "stop-b",
        name: "Blue River",
        arrivalDate: "2026-07-07T00:00:00.000Z",
        departureDate: "2026-07-09T00:00:00.000Z",
      }),
      makeStop({
        id: "stop-c",
        name: "No Dates",
      }),
    ]);

    expect(days).toHaveLength(2);
    expect(days[0]?.items[0]).toMatchObject({
      kind: "stop-arrival",
      stopId: "stop-b",
    });
    expect(days[1]?.items[0]).toMatchObject({
      kind: "stop-departure",
      stopId: "stop-b",
    });
    expect(days.flatMap((day) => day.items).every((item) => item.stopId !== "stop-c")).toBe(true);
  });

  it("uses the stop detail tab href that matches the item type", () => {
    const days = buildDayPlans("trip-7", [
      makeStop({
        id: "stop-z",
        activities: [
          {
            id: "activity-z",
            name: "Stargazing",
            description: null,
            scheduledDate: "2026-07-06T00:00:00.000Z",
            startTime: "22:00",
            endTime: "23:00",
            durationMins: 60,
            estimatedCost: null,
            actualCost: null,
            status: ActivityStatus.OPTION,
            url: null,
            sortOrder: 0,
          },
        ],
        stays: [
          {
            id: "stay-z",
            name: "Camp",
            address: null,
            url: null,
            roomSiteNumbers: [],
            arrivalTime: null,
            checkIn: "2026-07-06T00:00:00.000Z",
            checkInTime: "15:00",
            checkOut: null,
            checkOutTime: null,
            leaveTime: null,
            pricePerNight: null,
            totalPrice: null,
            status: StayStatus.OPTION,
            notes: null,
            confirmationNo: null,
          },
        ],
      }),
    ]);

    const items = days[0]?.items ?? [];
    expect(items.find((item) => item.kind === "activity")?.href).toBe("/trips/trip-7/stops/stop-z?tab=activities");
    expect(items.find((item) => item.kind === "stay")?.href).toBe("/trips/trip-7/stops/stop-z?tab=stays");
  });
});
