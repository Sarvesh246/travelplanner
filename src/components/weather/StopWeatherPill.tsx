"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { WeatherPill, WEATHER_PILL_SHELL } from "@/components/weather/WeatherPill";
import type { WeatherState } from "@/lib/weather/types";
import { cn } from "@/lib/utils";
import { stopForecastTimingCaption } from "@/lib/weather/stop-forecast-timing";

export function StopWeatherPill({
  latitude,
  longitude,
  arrivalDate,
  departureDate,
  className,
  addLocationHref,
}: {
  latitude: number | null;
  longitude: number | null;
  arrivalDate: string | null;
  departureDate: string | null;
  className?: string;
  /** When set and coords are missing, render a compact CTA link instead of dashed empty pill copy. */
  addLocationHref?: string;
}) {
  const targetDate = useMemo(
    () => arrivalDate?.slice(0, 10) || departureDate?.slice(0, 10) || null,
    [arrivalDate, departureDate]
  );

  const timingCaption = useMemo(
    () => stopForecastTimingCaption(arrivalDate, departureDate),
    [arrivalDate, departureDate]
  );

  const baseState = useMemo<WeatherState | null>(() => {
    if (latitude == null || longitude == null) {
      return { state: "empty", message: "Add location for weather" };
    }
    if (!targetDate) {
      return { state: "empty", message: "Set date for forecast" };
    }
    return null;
  }, [latitude, longitude, targetDate]);

  const [weather, setWeather] = useState<WeatherState | { state: "loading" }>(
    baseState ?? { state: "loading" }
  );

  const requestKey = baseState
    ? null
    : `${latitude?.toFixed(3) ?? "none"}:${longitude?.toFixed(3) ?? "none"}:${targetDate ?? "none"}`;

  useEffect(() => {
    if (baseState || latitude == null || longitude == null || !targetDate || requestKey == null) {
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      date: targetDate,
    });

    fetch(`/api/weather/stop?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Weather request failed");
        }

        return (await response.json()) as WeatherState;
      })
      .then((payload) => setWeather(payload))
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setWeather({ state: "error", message: "Outlook unavailable" });
      });

    return () => controller.abort();
  }, [baseState, latitude, longitude, requestKey, targetDate]);

  const displayedWeather =
    baseState ?? (requestKey && weather.state !== "loading" ? weather : { state: "loading" as const });

  const showTiming = latitude != null && longitude != null && targetDate != null;

  if (
    addLocationHref &&
    latitude == null &&
    longitude == null &&
    displayedWeather.state === "empty"
  ) {
    return (
      <Link
        href={addLocationHref}
        title="Weather and map preview need a location."
        className={cn(
          WEATHER_PILL_SHELL,
          "rounded-full border border-border/75 bg-primary/11 text-[11px] font-semibold text-primary shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)] transition-colors duration-200 hover:bg-primary/16",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        Add location
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex max-w-[min(14rem,calc(100vw-13rem))] flex-col gap-1 align-top",
        className
      )}
    >
      {showTiming && timingCaption ? (
        <span className="truncate text-[10px] font-semibold uppercase tracking-wide leading-none text-muted-foreground/90">
          {timingCaption}
        </span>
      ) : null}
      <WeatherPill weather={displayedWeather} />
    </div>
  );
}
