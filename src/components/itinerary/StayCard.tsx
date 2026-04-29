"use client";

import { useState } from "react";
import { Bed, ExternalLink, MoreHorizontal, Trash2, CheckCircle2, CircleDashed, Ban, Loader2 } from "lucide-react";
import { cn, formatCurrency, formatDateRange } from "@/lib/utils";
import { STAY_STATUS_COLORS } from "@/lib/constants";
import { updateStay, deleteStay } from "@/actions/itinerary";
import { toast } from "sonner";
import { StayStatus } from "@prisma/client";
import type { StaySerialized } from "./types";

interface StayCardProps {
  stay: StaySerialized;
  canEdit: boolean;
}

const STATUS_ICONS: Record<StayStatus, React.ReactNode> = {
  OPTION: <CircleDashed className="w-3 h-3" />,
  BOOKED: <CheckCircle2 className="w-3 h-3" />,
  CANCELLED: <Ban className="w-3 h-3" />,
};

export function StayCard({ stay, canEdit }: StayCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<StayStatus | null>(null);

  async function setStatus(status: StayStatus) {
    setMenuOpen(false);
    setPendingStatus(status);
    try {
      await updateStay(stay.id, { status });
      toast.success(`Marked ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update this stay. Please try again.");
    } finally {
      setPendingStatus(null);
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    try {
      await deleteStay(stay.id);
      toast.success("Stay removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove this stay. Please try again.");
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Bed className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm truncate">{stay.name}</h4>
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full", STAY_STATUS_COLORS[stay.status])}>
              {pendingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : STATUS_ICONS[stay.status]}
              {stay.status}
            </span>
          </div>
          {stay.address && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{stay.address}</p>
          )}
          {(stay.checkIn || stay.checkOut) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDateRange(stay.checkIn, stay.checkOut)}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs">
            {stay.totalPrice !== null && (
              <span className="font-medium">{formatCurrency(stay.totalPrice)} total</span>
            )}
            {stay.pricePerNight !== null && (
              <span className="text-muted-foreground">{formatCurrency(stay.pricePerNight)}/night</span>
            )}
            {stay.url && (
              <a
                href={stay.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Link <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Stay options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-xl shadow-lg py-1 z-20">
                {stay.status !== "BOOKED" && (
                  <button onClick={() => setStatus("BOOKED")} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark booked
                  </button>
                )}
                {stay.status !== "OPTION" && (
                  <button onClick={() => setStatus("OPTION")} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted transition-colors">
                    <CircleDashed className="w-3.5 h-3.5" /> Mark option
                  </button>
                )}
                {stay.status !== "CANCELLED" && (
                  <button onClick={() => setStatus("CANCELLED")} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted transition-colors">
                    <Ban className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
                <div className="border-t border-border my-1" />
                <button onClick={handleDelete} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
