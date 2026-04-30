"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ItineraryFloatingControls() {
  const [showScrollTop, setShowScrollTop] = useState(false);

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
    </div>
  );
}
