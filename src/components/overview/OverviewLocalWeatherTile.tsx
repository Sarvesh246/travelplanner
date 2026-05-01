"use client";

import { CloudSun } from "lucide-react";
import { WeatherPill } from "@/components/weather/WeatherPill";
import type { WeatherState } from "@/lib/weather/types";

export function OverviewLocalWeatherTile({ weather }: { weather: WeatherState | null }) {
  const resolved = weather ?? { state: "empty", message: "Unavailable" };

  return (
    <div className="app-glass app-surface-soft flex min-h-[5rem] min-w-0 flex-col justify-center gap-2 rounded-xl px-3 py-3 transition-opacity duration-300 md:py-3.5">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/14 text-primary">
          <CloudSun className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground truncate max-[380px]:text-[10px]">
            Local outlook
          </p>
          {resolved.state === "ready" ? (
            <p className="truncate text-[13px] font-medium text-foreground">
              {resolved.data.locationLabel?.trim() || "Nearby"}
            </p>
          ) : (
            <p className="line-clamp-2 text-[12px] text-muted-foreground">{resolved.message}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0">
        <WeatherPill weather={resolved} compact />
      </div>
    </div>
  );
}
