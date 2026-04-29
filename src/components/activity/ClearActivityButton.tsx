"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { clearTripActivity } from "@/actions/trips";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export function ClearActivityButton({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);

  async function handleClear() {
    try {
      await clearTripActivity(tripId);
      toast.success("Trip activity cleared");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not clear trip activity");
      throw err;
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-destructive/35 bg-destructive/10 px-3.5 py-2 text-sm font-semibold text-destructive transition-[background-color,border-color,box-shadow,transform] duration-200 hover:border-destructive/55 hover:bg-destructive/18 hover:shadow-[0_10px_24px_-18px_hsl(var(--destructive))] active:scale-[0.99]"
      >
        <Trash2 className="h-4 w-4" />
        Clear activity
      </button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Clear trip activity?"
        description="This removes the recorded activity feed for this trip. It does not delete the trip, stops, expenses, supplies, votes, or members."
        confirmLabel="Clear activity"
        onConfirm={handleClear}
      />
    </>
  );
}
