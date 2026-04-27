"use client";

import { MapPin, GripVertical, Bed, CalendarDays, ChevronRight } from "lucide-react";
import { formatDateRange } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { StopSerialized } from "./types";
import type { HTMLAttributes, DOMAttributes } from "react";

type DragHandle = HTMLAttributes<HTMLButtonElement> & DOMAttributes<HTMLButtonElement>;

interface StopCardProps {
  stop: StopSerialized;
  index: number;
  onSelect: () => void;
  dragHandleProps?: DragHandle;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-[hsl(var(--secondary)/0.1)] text-[hsl(var(--secondary))] dark:bg-[hsl(var(--secondary)/0.15)]",
  CONFIRMED: "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] dark:bg-[hsl(var(--primary)/0.15)]",
  CANCELLED: "bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))] dark:bg-[hsl(var(--destructive)/0.15)]",
};

export function StopCard({ stop, index, onSelect, dragHandleProps }: StopCardProps) {
  return (
    <div className="relative">
      <span
        className="absolute -left-[1.125rem] top-6 z-10 h-3 w-3 rounded-full border-2 border-background bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.12),0_0_14px_hsl(var(--primary)/0.45)]"
        aria-hidden
      />
      <div className="app-surface app-hover-lift group flex items-stretch overflow-hidden rounded-2xl">
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
          className="flex-1 text-left p-4 flex items-start gap-3"
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
              <span className={cn("ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full", STATUS_STYLES[stop.status])}>
                {stop.status}
              </span>
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
          <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0 self-center group-hover:text-muted-foreground transition-colors" />
        </button>
      </div>
    </div>
  );
}
