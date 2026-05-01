import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type ForecastPayload,
  forecastDateKeyExtents,
  forecastGapMessage,
  normalizeCurrentWeather,
  pickForecastEntryForDate,
} from "@/lib/weather/openweather";

describe("openweather utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("normalizes current weather payloads into a compact snapshot", () => {
    expect(
      normalizeCurrentWeather({
        name: "Denver",
        sys: { country: "US" },
        main: { temp: 71.6 },
        weather: [{ main: "Clouds", icon: "03d" }],
      })
    ).toEqual({
      tempF: 72,
      conditionShort: "Clouds",
      iconCode: "03d",
      forecastDate: expect.any(String),
      locationLabel: "Denver, US",
    });
  });

  it("picks the same-day forecast entry closest to local noon", () => {
    const snapshot = pickForecastEntryForDate(
      {
        city: { timezone: 0, name: "Moab", country: "US" },
        list: [
          { dt: Date.UTC(2026, 6, 5, 6) / 1000, main: { temp: 63 }, weather: [{ main: "Clear", icon: "01d" }] },
          { dt: Date.UTC(2026, 6, 5, 12) / 1000, main: { temp: 70 }, weather: [{ main: "Clouds", icon: "03d" }] },
          { dt: Date.UTC(2026, 6, 6, 12) / 1000, main: { temp: 74 }, weather: [{ main: "Rain", icon: "10d" }] },
        ],
      },
      "2026-07-05"
    );

    expect(snapshot).toEqual({
      tempF: 70,
      conditionShort: "Clouds",
      iconCode: "03d",
      forecastDate: "2026-07-05",
      locationLabel: "Moab, US",
    });
  });

  it("derives extents from the forecast slices", () => {
    expect(
      forecastDateKeyExtents({
        city: { timezone: 0 },
        list: [
          { dt: Date.UTC(2026, 6, 8, 3) / 1000 },
          { dt: Date.UTC(2026, 6, 6, 3) / 1000 },
        ],
      })
    ).toEqual({ minKey: "2026-07-06", maxKey: "2026-07-08" });
  });

  it("explains misses before coverage, beyond coverage, and interior gaps differently", () => {
    const payload: ForecastPayload = {
      city: { timezone: 0 },
      list: [{ dt: Date.UTC(2026, 6, 5, 12) / 1000 }],
    };

    expect(forecastGapMessage(payload, "2026-07-03")).toMatch(/before/i);
    expect(forecastGapMessage(payload, "2026-07-09")).toMatch(/past.+outlook/i);
    expect(forecastGapMessage(payload, "2026-07-05")).toContain("Outlook");
  });

  it("returns null when the forecast window does not include the stop date", () => {
    expect(
      pickForecastEntryForDate(
        {
          city: { timezone: 0, name: "Moab", country: "US" },
          list: [
            {
              dt: Date.UTC(2026, 6, 5, 12) / 1000,
              main: { temp: 70 },
              weather: [{ main: "Clouds", icon: "03d" }],
            },
          ],
        },
        "2026-07-10"
      )
    ).toBeNull();
  });
});
