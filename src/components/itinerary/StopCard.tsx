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
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  CONFIRMED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export function StopCard({ stop, index, onSelect, dragHandleProps }: StopCardProps) {
  return (
    <div className="group flex items-stretch bg-card border border-border rounded-2xl overflow-hidden hover:border-border/80 hover:shadow-sm transition-all">
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
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
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
  );
}
