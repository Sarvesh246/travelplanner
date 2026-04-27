"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { InviteDialog } from "@/components/members/InviteDialog";
import { useTripContext } from "@/components/trip/TripContext";

export function OverviewShareButton() {
  const { trip, canManage } = useTripContext();
  const [open, setOpen] = useState(false);

  if (!canManage) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="app-hover-lift inline-flex min-h-10 w-full min-[480px]:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60"
      >
        <UserPlus className="w-4 h-4" />
        Share
      </button>
      <InviteDialog open={open} onOpenChange={setOpen} tripId={trip.id} />
    </>
  );
}
