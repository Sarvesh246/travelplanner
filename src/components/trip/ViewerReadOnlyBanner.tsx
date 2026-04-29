"use client";

import { useTripContext } from "@/components/trip/TripContext";
import { Eye } from "lucide-react";

export function ViewerReadOnlyBanner() {
  const { isViewer } = useTripContext();
  if (!isViewer) return null;

  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] px-3 py-3 text-sm shadow-sm backdrop-blur-sm transition-colors duration-300 dark:bg-primary/[0.1]"
      role="status"
    >
      <Eye className="w-5 h-5 shrink-0 text-primary mt-0.5" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        <p className="font-semibold text-foreground">Viewer mode</p>
        <p className="text-muted-foreground leading-snug">
          You can review the full plan and discuss in context — editing, inviting, voting, expenses, and
          supplies remain available to collaborators with edit access.
        </p>
      </div>
    </div>
  );
}
