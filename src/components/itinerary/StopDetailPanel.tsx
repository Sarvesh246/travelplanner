"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { StopDetailView } from "./StopDetailView";
import { useTripContext } from "@/components/trip/TripContext";
import type { StopSerialized } from "./types";

interface StopDetailPanelProps {
  stop: StopSerialized | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isInteractiveDrawerTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        'input, textarea, select, button, a, [role="button"], [role="dialog"], [contenteditable="true"], [data-no-swipe]'
      )
    )
  );
}

export function StopDetailPanel({ stop, open, onOpenChange }: StopDetailPanelProps) {
  const { trip } = useTripContext();
  const touchRef = useRef<{ x: number; y: number; blocked: boolean } | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  function handleTouchStart(e: React.TouchEvent<HTMLElement>) {
    const t = e.touches[0];
    touchRef.current = {
      x: t.clientX,
      y: t.clientY,
      blocked: isInteractiveDrawerTarget(e.target),
    };
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLElement>) {
    const state = touchRef.current;
    touchRef.current = null;
    if (!state || state.blocked) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - state.x;
    const dy = t.clientY - state.y;
    if (dx < 72 || Math.abs(dy) > 56) return;

    onOpenChange(false);
  }

  if (!open || !stop) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[440px] bg-card border-l border-border shadow-2xl z-50 flex flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <StopDetailView
            stop={stop}
            tripId={trip.id}
            layout="drawer"
            onCloseDrawer={() => onOpenChange(false)}
          />
        </div>
      </motion.aside>
    </>
  );
}
