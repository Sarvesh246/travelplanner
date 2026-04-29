"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { duplicateTrip } from "@/actions/trips";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";

export function OverviewDuplicateButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      const { tripId: newId } = await duplicateTrip(tripId);
      toast.success("Trip duplicated", { description: "Opening your copied plan…" });
      router.push(ROUTES.tripOverview(newId));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not duplicate this trip.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void handleClick()}
      className="app-hover-lift inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted sm:py-2"
    >
      <Copy className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      <span>Use as starting point</span>
    </button>
  );
}
