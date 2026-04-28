"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { STORAGE_TRIP_SWIPE_HINT } from "@/components/layout/trip-tips-copy";

/**
 * One-time banner (mobile/tablet widths) reminding users they can swipe between trip sections.
 */
export function TripSwipeHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.innerWidth >= 768) return;
      if (localStorage.getItem(STORAGE_TRIP_SWIPE_HINT) === "1") return;
    } catch {
      return;
    }

    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_TRIP_SWIPE_HINT, "1");
    } catch {
      /* ignore quota */
    }
  }

  return (
    <div
      role="note"
      className="md:hidden mb-3 flex gap-3 rounded-xl border border-primary/35 bg-primary/10 px-3 py-3 text-sm shadow-sm transition-colors duration-200 animate-in fade-in slide-in-from-top-1 duration-300"
      data-no-swipe=""
    >
      <p className="min-w-0 flex-1 leading-snug text-foreground">
        <span className="font-semibold text-primary">Swipe</span>
        {" "}
        left or right outside buttons and inputs to jump between Summary, Route, Gear, Costs, Votes,
        and Members.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss swipe tip"
        className="relative z-[1] shrink-0 self-start rounded-lg p-1.5 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors duration-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
