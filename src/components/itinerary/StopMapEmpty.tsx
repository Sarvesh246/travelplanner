"use client";

import { MapPinOff } from "lucide-react";
import { cn } from "@/lib/utils";

type StopMapEmptyProps = {
  className?: string;
  variant?: "cta" | "static" | "skeleton";
  onAddLocation?: () => void;
  compact?: boolean;
};

const TILE = "aspect-[16/9] min-h-[220px] max-h-[min(52dvh,340px)]";
const TILE_COMPACT = "aspect-[16/9] min-h-[120px] max-h-[min(26dvh,210px)]";

export function StopMapEmpty({
  className,
  variant = "static",
  onAddLocation,
  compact = false,
}: StopMapEmptyProps) {
  const tile = compact ? TILE_COMPACT : TILE;

  if (variant === "skeleton") {
    return (
      <div
        className={cn(
          "app-topo-empty relative w-full overflow-hidden rounded-2xl border border-border bg-muted/15 animate-pulse",
          tile,
          className
        )}
        aria-hidden
      />
    );
  }

  const isCta = variant === "cta" && typeof onAddLocation === "function";

  return (
    <div
      className={cn(
        "app-topo-empty relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/10 px-4 py-6 text-center",
        tile,
        className
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/80 bg-card/70 text-muted-foreground shadow-sm">
        <MapPinOff className="h-6 w-6" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-foreground">No location yet</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        Add a pin to see this stop on the map and unlock weather on the itinerary.
      </p>
      {isCta ? (
        <button
          type="button"
          onClick={onAddLocation}
          className="mt-4 inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
        >
          Add location
        </button>
      ) : null}
      <p className="mt-4 text-[10px] text-muted-foreground/80">
        Map data ©{" "}
        <a className="underline underline-offset-2 hover:text-foreground" href="https://www.openstreetmap.org/copyright">
          OpenStreetMap
        </a>{" "}
        contributors
      </p>
    </div>
  );
}
