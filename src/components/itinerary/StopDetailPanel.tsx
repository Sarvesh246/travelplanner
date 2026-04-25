"use client";

import { motion } from "framer-motion";
import { StopDetailView } from "./StopDetailView";
import { useTripContext } from "@/components/trip/TripContext";
import type { StopSerialized } from "./types";

interface StopDetailPanelProps {
  stop: StopSerialized | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StopDetailPanel({ stop, open, onOpenChange }: StopDetailPanelProps) {
  const { trip } = useTripContext();

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
