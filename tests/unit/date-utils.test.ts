import { describe, expect, it, vi } from "vitest";
import { daysUntil, formatDateRange, tripDuration } from "@/lib/utils";

describe("date utilities", () => {
  it("keeps date-only strings on the selected calendar day", () => {
    expect(formatDateRange("2026-07-05", "2026-07-10")).toBe("Jul 5–10, 2026");
  });

  it("keeps UTC-midnight database dates on the selected calendar day", () => {
    expect(
      formatDateRange(
        new Date("2026-07-05T00:00:00.000Z"),
        new Date("2026-07-10T00:00:00.000Z")
      )
    ).toBe("Jul 5–10, 2026");
  });

  it("uses the same calendar-day math for countdowns and durations", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T12:00:00.000-05:00"));

    expect(daysUntil("2026-07-05")).toBe(67);
    expect(daysUntil(new Date("2026-07-05T00:00:00.000Z"))).toBe(67);
    expect(tripDuration("2026-07-05", "2026-07-10")).toBe(6);

    vi.useRealTimers();
  });
});
