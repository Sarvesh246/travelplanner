"use client";

import Link from "next/link";
import { MapPin, GripVertical, Bed, CalendarDays, ChevronRight, Map, Link2, CircleDot } from "lucide-react";
import { formatDateRange } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";
import type { StopSerialized } from "./types";
import type { HTMLAttributes, DOMAttributes } from "react";
import { StopWeatherPill } from "@/components/weather/StopWeatherPill";

type DragHandle = HTMLAttributes<HTMLButtonElement> & DOMAttributes<HTMLButtonElement>;

interface StopCardProps {
  tripId: string;
  stop: StopSerialized;
  index: number;
  selected?: boolean;
  onSelect: () => void;
  onButtonRef?: (el: HTMLButtonElement | null) => void;
  dragHandleProps?: DragHandle;
}

function formatStopStatus(status: string) {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function StopCard({
  tripId,
  stop,
  index,
  selected = false,
  onSelect,
  onButtonRef,
  dragHandleProps,
}: StopCardProps) {
  async function copyStopPageLink(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      await navigator.clipboard.writeText(`${origin}${ROUTES.tripStop(tripId, stop.id)}`);
      toast.success("Stop link copied", { description: "Share with anyone who has trip access." });
    } catch {
      toast.error("Could not copy link");
    }
  }

  const hasCoords = stop.latitude != null && stop.longitude != null;
  const stopPageHref = ROUTES.tripStop(tripId, stop.id);

  return (
    <div className="relative min-w-0 max-w-full">
      <span
        className="absolute -left-[1.125rem] top-6 z-10 h-3 w-3 rounded-full border-2 border-background bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.12),0_0_14px_hsl(var(--primary)/0.45)]"
        aria-hidden
      />
      <div
        className={cn(
          "app-surface app-hover-lift group relative flex min-w-0 max-w-full items-stretch overflow-hidden rounded-2xl",
          selected && "ring-2 ring-primary/35"
        )}
      >
        {dragHandleProps && (
          <button
            type="button"
            className="flex touch-none select-none items-center px-2 text-muted-foreground/50 transition-colors hover:bg-muted/60 hover:text-muted-foreground active:cursor-grabbing min-[390px]:px-3 md:cursor-grab"
            aria-label="Drag to reorder"
            data-no-swipe=""
            {...dragHandleProps}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onSelect}
          ref={onButtonRef}
          aria-pressed={selected}
          className="flex min-w-0 flex-1 flex-col gap-2.5 p-4 pr-14 text-left md:pr-32"
        >
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-lg font-bold text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.14)]">
              #{index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-foreground">
                {stop.name}
              </h3>
              {stop.country ? (
                <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                  <span className="line-clamp-2 min-w-0 break-words leading-snug">{stop.country}</span>
                </p>
              ) : null}
            </div>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 self-start text-muted-foreground/60 transition-colors group-hover:text-muted-foreground md:hidden" />
          </div>

          <div className="flex min-w-0 flex-col gap-2.5">
            <div className="flex flex-wrap gap-2">
              {(stop.arrivalDate || stop.departureDate) ? (
                <span className="inline-flex min-h-8 min-w-0 max-w-full items-center gap-1.5 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden />
                  <span className="truncate">{formatDateRange(stop.arrivalDate, stop.departureDate)}</span>
                </span>
              ) : null}
              <span className="inline-flex min-h-8 min-w-0 max-w-full items-center gap-1.5 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden />
                {hasCoords ? (
                  <span className="min-w-0 truncate font-mono tabular-nums text-[11px]">
                    {stop.latitude!.toFixed(2)}, {stop.longitude!.toFixed(2)}
                  </span>
                ) : (
                  <span>No pin</span>
                )}
              </span>
            </div>

            <div className="min-w-0 self-start">
              <StopWeatherPill
                className="items-start"
                latitude={stop.latitude}
                longitude={stop.longitude}
                arrivalDate={stop.arrivalDate}
                departureDate={stop.departureDate}
                addLocationHref={!hasCoords ? stopPageHref : undefined}
              />
            </div>

            <span className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-muted/20 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <CircleDot className="h-3 w-3 shrink-0 text-primary/70" aria-hidden />
              <span className="truncate">{formatStopStatus(stop.status)}</span>
            </span>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border/50 pt-2.5 text-[11px] text-muted-foreground/90">
              <span className="inline-flex items-center gap-1.5">
                <Bed className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                {stop.stays.length} stay{stop.stays.length !== 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                {stop.activities.length} activit{stop.activities.length !== 1 ? "ies" : "y"}
              </span>
            </div>
          </div>
        </button>
        <div className="pointer-events-none absolute inset-y-0 right-4 z-[1] hidden w-auto items-center justify-end gap-1.5 md:flex">
          <button
            type="button"
            title="Copy link to stop page"
            aria-label={`Copy link for ${stop.name}`}
            className="pointer-events-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card/85 text-muted-foreground opacity-0 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/35 hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
            onClick={(e) => void copyStopPageLink(e)}
          >
            <Link2 className="h-4 w-4" />
          </button>
          <Link
            href={stopPageHref}
            title="Open stop map view"
            aria-label={`Open ${stop.name} on map`}
            className="pointer-events-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card/85 text-muted-foreground opacity-0 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/35 hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Map className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
