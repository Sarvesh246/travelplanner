"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bed, CalendarDays, Plus, MapPin, Trash2, Loader2 } from "lucide-react";
import { formatDateRange } from "@/lib/utils";
import { StayCard } from "./StayCard";
import { DayTimeline } from "./DayTimeline";
import { createStay, createActivity, deleteStop } from "@/actions/itinerary";
import { useTripContext } from "@/components/trip/TripContext";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import type { StopSerialized } from "./types";

interface StopDetailPanelProps {
  stop: StopSerialized | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StopDetailPanel({ stop, open, onOpenChange }: StopDetailPanelProps) {
  const { canEdit } = useTripContext();
  const [tab, setTab] = useState<"stays" | "activities">("stays");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) setTab("stays");
  }, [open, stop?.id]);

  async function handleDelete() {
    if (!stop) return;
    try {
      await deleteStop(stop.id);
      toast.success("Stop deleted");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <AnimatePresence>
      {open && stop && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => onOpenChange(false)}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[440px] bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            <header className="p-5 border-b border-border flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-lg truncate">{stop.name}</h2>
                {stop.country && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {stop.country}
                  </p>
                )}
                {(stop.arrivalDate || stop.departureDate) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateRange(stop.arrivalDate, stop.departureDate)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {canEdit && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Delete stop"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onOpenChange(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            <div className="flex border-b border-border">
              <TabButton active={tab === "stays"} onClick={() => setTab("stays")}>
                <Bed className="w-3.5 h-3.5" /> Stays ({stop.stays.length})
              </TabButton>
              <TabButton active={tab === "activities"} onClick={() => setTab("activities")}>
                <CalendarDays className="w-3.5 h-3.5" /> Activities ({stop.activities.length})
              </TabButton>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {tab === "stays" && <StaysTab stop={stop} canEdit={canEdit} />}
              {tab === "activities" && <ActivitiesTab stop={stop} canEdit={canEdit} />}
            </div>
          </motion.aside>

          <ConfirmDialog
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            title={`Delete ${stop.name}?`}
            description="This will remove the stop and all its stays and activities."
            confirmLabel="Delete"
            onConfirm={handleDelete}
          />
        </>
      )}
    </AnimatePresence>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
      {active && (
        <motion.div
          layoutId="stop-detail-tab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}

function StaysTab({ stop, canEdit }: { stop: StopSerialized; canEdit: boolean }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      {stop.stays.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground text-center py-6">No stays yet.</p>
      )}
      {stop.stays.map((stay) => (
        <StayCard key={stay.id} stay={stay} canEdit={canEdit} />
      ))}
      {adding && <AddStayForm stopId={stop.id} onDone={() => setAdding(false)} />}
      {canEdit && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-xl py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add stay
        </button>
      )}
    </div>
  );
}

function ActivitiesTab({ stop, canEdit }: { stop: StopSerialized; canEdit: boolean }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      <DayTimeline activities={stop.activities} canEdit={canEdit} />
      {adding && <AddActivityForm stopId={stop.id} onDone={() => setAdding(false)} />}
      {canEdit && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-xl py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add activity
        </button>
      )}
    </div>
  );
}

function AddStayForm({ stopId, onDone }: { stopId: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createStay(stopId, {
        name: name.trim(),
        address: address.trim() || undefined,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        totalPrice: totalPrice ? parseFloat(totalPrice) : undefined,
      });
      toast.success("Stay added");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add stay");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-muted/40 rounded-xl p-4 space-y-3 border border-border">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Stay name (e.g. Park Hyatt)"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Address (optional)"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          min={checkIn}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <input
        type="number"
        value={totalPrice}
        onChange={(e) => setTotalPrice(e.target.value)}
        placeholder="Total price (optional)"
        step="0.01"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onDone}
          className="text-sm px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          Save
        </button>
      </div>
    </form>
  );
}

function AddActivityForm({ stopId, onDone }: { stopId: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createActivity(stopId, {
        name: name.trim(),
        scheduledDate: scheduledDate || undefined,
        scheduledTime: scheduledTime || undefined,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      });
      toast.success("Activity added");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add activity");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-muted/40 rounded-xl p-4 space-y-3 border border-border">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Activity name (e.g. Fushimi Inari)"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="time"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <input
        type="number"
        value={estimatedCost}
        onChange={(e) => setEstimatedCost(e.target.value)}
        placeholder="Estimated cost (optional)"
        step="0.01"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onDone}
          className="text-sm px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          Save
        </button>
      </div>
    </form>
  );
}
