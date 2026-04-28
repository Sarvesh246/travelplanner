"use client";

import { useEffect, useState } from "react";
import { ArrowUp, MapPin } from "lucide-react";
import { findRelevantStopForToday } from "@/lib/itinerary/today-stop";
import type { StopSerialized } from "./types";
import { cn } from "@/lib/utils";

interface ItineraryFloatingControlsProps {
  stops: StopSerialized[];
}

export function ItineraryFloatingControls({ stops }: ItineraryFloatingControlsProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const targetId = findRelevantStopForToday(stops);

  function getMainScroll(): HTMLElement | null {
    return typeof document === "undefined"
      ? null
      : document.querySelector<HTMLElement>("[data-trip-main-scroll]");
  }

  function prefersReducedMotion() {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function scrollTripMainTop() {
    const behavior: ScrollBehavior = prefersReducedMotion() ? "instant" : "smooth";
    getMainScroll()?.scrollTo({ top: 0, behavior });
  }

  function scrollToStop(stopId: string) {
    const el = document.getElementById(`trip-stop-${stopId}`);
    const behavior: ScrollBehavior = prefersReducedMotion() ? "instant" : "smooth";
    el?.scrollIntoView({ behavior, block: "center" });
  }

  useEffect(() => {
    const el = getMainScroll();
    if (!el) return;
    function onScroll() {
      const scrollEl = getMainScroll();
      if (!scrollEl) return;
      setShowScrollTop(scrollEl.scrollTop > 220);
    }
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (stops.length === 0) return null;

  return (
    <div className="pointer-events-none fixed z-[34] bottom-[calc(5.95rem+env(safe-area-inset-bottom,0px))] right-4 flex flex-col items-end gap-2 md:bottom-auto md:right-6 md:top-[calc(env(safe-area-inset-top,0)+7.85rem)]">
      {showScrollTop ? (
        <button
          type="button"
          onClick={() => scrollTripMainTop()}
          aria-label="Scroll itinerary to top"
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/95 text-foreground shadow-[0_10px_32px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md transition-[transform,background-color,color,box-shadow] duration-300 hover:bg-muted/95 hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          title="Back to top"
        >
          <ArrowUp className="h-5 w-5" aria-hidden />
        </button>
      ) : null}
      {targetId ? (
        <button
          type="button"
          onClick={() => scrollToStop(targetId)}
          aria-label="Jump to focal stop along your dates"
          title="Jump to current or next stop dates"
          className={cn(
            "pointer-events-auto border border-border/80 bg-card/95 text-foreground shadow-[0_10px_32px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md transition-[background-color,color,box-shadow,border-color] duration-300 hover:border-primary/35 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
            "flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold md:flex md:h-auto md:w-auto md:py-2",
            "h-11 w-11 min-w-[2.75rem] justify-center p-0 md:min-h-0 md:h-auto md:w-auto md:justify-start md:px-3.5",
          )}
        >
          <MapPin className={cn("h-5 w-5 shrink-0 md:h-4 md:w-4")} aria-hidden />
          <span className="hidden md:inline text-left leading-tight">Jump dates</span>
        </button>
      ) : null}
    </div>
  );
}
