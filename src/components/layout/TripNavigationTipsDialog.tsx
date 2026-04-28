"use client";

import { X } from "lucide-react";
import { TRIP_NAV_TIPS } from "@/components/layout/trip-tips-copy";

interface TripNavigationTipsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TripNavigationTipsDialog({
  open,
  onOpenChange,
}: TripNavigationTipsDialogProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trip-tips-heading"
      className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-6"
    >
      <button
        type="button"
        aria-label="Close trip tips"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-200"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="relative z-[1] mt-auto w-full max-w-md rounded-t-3xl border border-border bg-popover px-5 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 shadow-xl sm:mt-0 sm:rounded-2xl sm:pb-6 transition-transform duration-300 animate-in fade-in zoom-in-95"
        data-no-swipe=""
      >
        <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <h2 id="trip-tips-heading" className="text-base font-semibold">
            Trip navigation
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="space-y-4 py-4 text-sm text-muted-foreground">
          {TRIP_NAV_TIPS.map((tip) => (
            <li key={tip.title}>
              <p className="font-medium text-foreground">{tip.title}</p>
              <p className="mt-1 leading-snug">{tip.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
