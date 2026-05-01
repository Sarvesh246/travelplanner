import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WeatherPill } from "@/components/weather/WeatherPill";

describe("WeatherPill", () => {
  it("renders a compact ready state", () => {
    const html = renderToStaticMarkup(
      React.createElement(WeatherPill, {
        weather: {
          state: "ready",
          data: {
            tempF: 72,
            conditionShort: "Clouds",
            iconCode: "03d",
            forecastDate: "2026-07-05",
          },
        },
      })
    );

    expect(html).toContain("72°F");
    expect(html).toContain("Clouds");
    expect(html).toContain("03d");
  });

  it("renders a subtle empty state", () => {
    const html = renderToStaticMarkup(
      React.createElement(WeatherPill, {
        weather: {
          state: "empty",
          message: "Add location for weather",
        },
      })
    );

    expect(html).toContain("Add location for weather");
  });
});
