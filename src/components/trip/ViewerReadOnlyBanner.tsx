"use client";

import { useTripContext } from "@/components/trip/TripContext";
import { Eye } from "lucide-react";

export function ViewerReadOnlyBanner() {
  const { isViewer } = useTripContext();
  if (!isViewer) return null;

  return (
    <div
      className="app-glass mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground"
      role="status"
    >
      <Eye className="w-4 h-4 shrink-0" aria-hidden />
      <span>
        You have read-only access to this trip. You can view everything, but you cannot add or edit
        content.
      </span>
    </div>
  );
}
