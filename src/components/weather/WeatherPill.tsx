"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { WeatherState } from "@/lib/weather/types";
import { weatherToneFromIcon } from "@/lib/weather/weather-tone";

function iconUrl(iconCode: string) {
  return `https://openweathermap.org/img/wn/${iconCode}.png`;
}

/** Stable footprint with min/max tied to parent width (avoid viewport math that overflows narrow cards). */
export const WEATHER_PILL_SHELL =
  "box-border min-h-8 max-w-[min(13rem,100%)] min-w-[min(11rem,100%)] justify-center px-3 py-1";

export function WeatherPill({
  weather,
  className,
  compact = false,
}: {
  weather: WeatherState | { state: "loading" };
  className?: string;
  compact?: boolean;
}) {
  const shell = cn(
    "inline-flex items-center gap-2 rounded-full border text-[11px] transition-colors transition-shadow duration-200 ease-out",
    WEATHER_PILL_SHELL,
    compact && "min-w-0 max-w-none w-full justify-start",
    className
  );

  if (weather.state === "loading") {
    return (
      <span
        className={cn(
          shell,
          "border-[hsl(var(--border)/0.72)] bg-[hsl(var(--card)/0.55)] animate-pulse text-muted-foreground"
        )}
      >
        <span className="h-[18px] w-[18px] shrink-0 rounded-full bg-muted" aria-hidden />
        <span className="flex min-w-[6.5rem] flex-col gap-1">
          <span className="h-3 w-full max-w-[5.75rem] rounded bg-muted/90" aria-hidden />
          <span className="h-2 w-14 rounded bg-muted/70" aria-hidden />
        </span>
      </span>
    );
  }

  if (weather.state === "ready") {
    const { shell: toneShell } = weatherToneFromIcon(weather.data.iconCode);
    return (
      <span
        className={cn(shell, toneShell, "py-1.5 text-foreground")}
        title={[weather.data.forecastDate, weather.data.conditionShort].filter(Boolean).join(" · ") || undefined}
      >
        <Image
          src={iconUrl(weather.data.iconCode)}
          alt=""
          width={18}
          height={18}
          unoptimized
          className="h-[18px] w-[18px] shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,.08)]"
        />
        <span className="flex min-w-0 items-baseline gap-1.5 leading-snug">
          <span className="shrink-0 font-semibold tabular-nums">{weather.data.tempF}°F</span>
          <span className="truncate text-muted-foreground">{weather.data.conditionShort}</span>
        </span>
      </span>
    );
  }

  const message =
    weather.state === "error" ? weather.message.trim() || "Forecast issue" : weather.message;

  const emptyShell =
    "border-[hsl(var(--border)/0.7)] bg-[hsl(var(--muted)/0.42)] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)]";

  return (
    <span
      title={weather.state === "empty" ? message : undefined}
      className={cn(
        shell,
        emptyShell,
        weather.state === "error" && "border-[hsl(var(--destructive)/0.36)] bg-[hsl(var(--destructive)/0.08)] text-destructive/90",
        "text-muted-foreground"
      )}
    >
      <span className="line-clamp-2 min-w-0 text-center leading-snug sm:text-left">{message}</span>
    </span>
  );
}
