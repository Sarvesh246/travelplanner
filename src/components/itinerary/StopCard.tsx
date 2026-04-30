"use client";

import Link from "next/link";
import { MapPin, GripVertical, Bed, CalendarDays, ChevronRight, Map, Link2 } from "lucide-react";
import { formatDateRange } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";
import type { StopSerialized } from "./types";
import type { HTMLAttributes, DOMAttributes } from "react";

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

  return (
    <div className="relative">
      <span
        className="absolute -left-[1.125rem] top-6 z-10 h-3 w-3 rounded-full border-2 border-background bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.12),0_0_14px_hsl(var(--primary)/0.45)]"
        aria-hidden
      />
      <div
        className={cn(
          "app-surface app-hover-lift group relative flex items-stretch overflow-hidden rounded-2xl",
          selected && "ring-2 ring-primary/35"
        )}
      >
        {dragHandleProps && (
          <button
            type="button"
            className="flex items-center px-2 text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/60 cursor-grab active:cursor-grabbing transition-colors"
            aria-label="Drag to reorder"
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
          className="min-w-0 flex-1 text-left p-4 pr-14 md:pr-20 flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.12)]">
            <span className="font-bold text-primary text-sm">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base truncate">{stop.name}</h3>
              {stop.country && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  {stop.country}
                </span>
              )}
            </div>
            {(stop.arrivalDate || stop.departureDate) && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3" />
                {formatDateRange(stop.arrivalDate, stop.departureDate)}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Bed className="w-3 h-3" />
                {stop.stays.length} stay{stop.stays.length !== 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {stop.activities.length} activit{stop.activities.length !== 1 ? "ies" : "y"}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0 self-center group-hover:text-muted-foreground transition-colors md:hidden" />
        </button>
        <div className="pointer-events-none absolute inset-y-0 right-2 z-[1] hidden w-auto items-center justify-end gap-1.5 pr-0 md:flex">
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
            href={ROUTES.tripStop(tripId, stop.id)}
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
