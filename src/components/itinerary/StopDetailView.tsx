"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bed, CalendarDays, MapPin, Maximize2, Plus, Trash2, X, Loader2 } from "lucide-react";
import { formatDateRange } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { StayCard } from "./StayCard";
import { DayTimeline } from "./DayTimeline";
import { createStay, createActivity, deleteStop, restoreStop } from "@/actions/itinerary";
import { useTripContext } from "@/components/trip/TripContext";
import {
  useTripEditingPresenceField,
} from "@/components/collaboration/TripEditingPresenceProvider";
import { EditingPresenceNotice } from "@/components/collaboration/EditingPresenceNotice";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import { OsmMapEmbed, StopMapPlaceholder } from "./OsmMapEmbed";
import type { StopSerialized } from "./types";

export type StopDetailLayout = "drawer" | "page";

type StopDetailViewProps = {
  stop: StopSerialized;
  tripId: string;
  layout: StopDetailLayout;
  /** When layout is `drawer`, called for close and after delete. */
  onCloseDrawer?: () => void;
};

export function StopDetailView({ stop, tripId, layout, onCloseDrawer }: StopDetailViewProps) {
  const { canEdit } = useTripContext();
  const router = useRouter();
  const [tab, setTab] = useState<"stays" | "activities">("stays");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isPage = layout === "page";
  const hasMapCoords = stop.latitude != null && stop.longitude != null;

  function closeIfDrawer() {
    setConfirmDelete(false);
    onCloseDrawer?.();
  }

  async function handleDelete() {
    try {
      await deleteStop(stop.id);
      toast.success("Stop deleted", {
        action: {
          label: "Undo",
          onClick: () => {
            void restoreStop(stop.id);
          },
        },
      });
      if (isPage) {
        router.push(ROUTES.tripItinerary(tripId));
        return;
      }
      onCloseDrawer?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove this stop. Please try again.");
    }
  }

  const titleBlock = (
    <div className="flex-1 min-w-0">
      {isPage ? (
        <h1 className="font-semibold text-xl sm:text-2xl tracking-tight text-balance">{stop.name}</h1>
      ) : (
        <h2 className="font-semibold text-lg truncate">{stop.name}</h2>
      )}
      {stop.country && (
        <p
          className={`text-muted-foreground mt-0.5 flex items-start gap-1.5 ${
            isPage ? "text-sm" : "text-xs"
          }`}
        >
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {stop.country}
        </p>
      )}
      {(stop.arrivalDate || stop.departureDate) && (
        <p className={`text-muted-foreground mt-0.5 ${isPage ? "text-sm" : "text-xs"}`}>
          {formatDateRange(stop.arrivalDate, stop.departureDate)}
        </p>
      )}
    </div>
  );

  const actionButtons = (
    <div className="flex items-center gap-1 shrink-0">
      {!isPage && (
        <Link
          href={ROUTES.tripStop(tripId, stop.id)}
          onClick={() => onCloseDrawer?.()}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Open full page with map"
          aria-label="Expand stop to full page"
        >
          <Maximize2 className="w-4 h-4" />
        </Link>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Delete stop"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      {!isPage && (
        <button
          type="button"
          onClick={closeIfDrawer}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Close stop details"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const body = (
    <>
      {isPage && (
        <div className="mb-6">
          {hasMapCoords ? (
            <OsmMapEmbed
              latitude={stop.latitude!}
              longitude={stop.longitude!}
              title={`Map: ${stop.name}`}
            />
          ) : (
            <StopMapPlaceholder />
          )}
        </div>
      )}

      <div className="flex border-b border-border">
        <TabButton active={tab === "stays"} onClick={() => setTab("stays")} layoutIdSuffix={isPage ? "page" : "drawer"}>
          <Bed className="w-3.5 h-3.5" /> Stays ({stop.stays.length})
        </TabButton>
        <TabButton
          active={tab === "activities"}
          onClick={() => setTab("activities")}
          layoutIdSuffix={isPage ? "page" : "drawer"}
        >
          <CalendarDays className="w-3.5 h-3.5" /> Activities ({stop.activities.length})
        </TabButton>
      </div>

      <div className="flex-1 overflow-y-auto p-5 min-h-0">
        {tab === "stays" && <StaysTab stop={stop} canEdit={canEdit} />}
        {tab === "activities" && <ActivitiesTab stop={stop} canEdit={canEdit} />}
      </div>
    </>
  );

  if (isPage) {
    return (
      <div>
        <div className="mb-4">
          <Link
            href={ROUTES.tripItinerary(tripId)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Itinerary
          </Link>
        </div>

        <div className="surface-1 rounded-2xl border border-border flex flex-col min-h-0 max-w-full">
          <div className="p-5 border-b border-border flex items-start gap-3">
            {titleBlock}
            <div className="flex items-center gap-1 shrink-0">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Delete stop"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="px-5 pt-4 pb-4 flex-1 min-h-0 flex flex-col gap-0">{body}</div>
        </div>

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete ${stop.name}?`}
          description="This will remove the stop and all its stays and activities."
          confirmLabel="Delete"
          onConfirm={handleDelete}
        />
      </div>
    );
  }

  // Drawer: header + body only; shell is the parent aside
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border p-5 flex items-start gap-3">
        {titleBlock}
        {actionButtons}
      </div>
      {body}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${stop.name}?`}
        description="This will remove the stop and all its stays and activities."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  layoutIdSuffix,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  layoutIdSuffix: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
      {active && (
        <motion.div
          layoutId={`stop-detail-tab-${layoutIdSuffix}`}
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
          type="button"
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
          type="button"
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
  const fieldPrefix = `stay-${stopId}`;
  const surfaceId = `stop-stay:${stopId}`;
  const namePresence = useTripEditingPresenceField({
    surfaceId,
    surfaceLabel: "Add stay",
    resourceId: `stay:${stopId}`,
    resourceLabel: "New stay",
    fieldKey: "name",
    fieldLabel: "stay name",
  });

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
      toast.error(err instanceof Error ? err.message : "Could not add this stay. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-muted/40 rounded-xl p-4 space-y-3 border border-border">
      <EditingPresenceNotice editors={namePresence.surfaceEditors} mode="surface" className="mt-0" />
      <input
        id={`${fieldPrefix}-name`}
        name="stay-name"
        aria-label="Stay name"
        autoFocus
        value={name}
        onChange={(e) => {
          namePresence.activate();
          setName(e.target.value);
        }}
        onFocus={namePresence.activate}
        onBlur={namePresence.clear}
        placeholder="Stay name (e.g. Park Hyatt)"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <EditingPresenceNotice editors={namePresence.fieldEditors} />
      <input
        id={`${fieldPrefix}-address`}
        name="stay-address"
        aria-label="Stay address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Address (optional)"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          id={`${fieldPrefix}-check-in`}
          name="stay-check-in"
          aria-label="Check-in date"
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          id={`${fieldPrefix}-check-out`}
          name="stay-check-out"
          aria-label="Check-out date"
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          min={checkIn}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <input
        id={`${fieldPrefix}-total-price`}
        name="stay-total-price"
        aria-label="Stay total price"
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
  const fieldPrefix = `activity-${stopId}`;
  const surfaceId = `stop-activity:${stopId}`;
  const namePresence = useTripEditingPresenceField({
    surfaceId,
    surfaceLabel: "Add activity",
    resourceId: `activity:${stopId}`,
    resourceLabel: "New activity",
    fieldKey: "name",
    fieldLabel: "activity name",
  });

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
      toast.error(err instanceof Error ? err.message : "Could not add this activity. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-muted/40 rounded-xl p-4 space-y-3 border border-border">
      <EditingPresenceNotice editors={namePresence.surfaceEditors} mode="surface" className="mt-0" />
      <input
        id={`${fieldPrefix}-name`}
        name="activity-name"
        aria-label="Activity name"
        autoFocus
        value={name}
        onChange={(e) => {
          namePresence.activate();
          setName(e.target.value);
        }}
        onFocus={namePresence.activate}
        onBlur={namePresence.clear}
        placeholder="Activity name (e.g. Fushimi Inari)"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <EditingPresenceNotice editors={namePresence.fieldEditors} />
      <div className="grid grid-cols-2 gap-2">
        <input
          id={`${fieldPrefix}-scheduled-date`}
          name="activity-scheduled-date"
          aria-label="Activity date"
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          id={`${fieldPrefix}-scheduled-time`}
          name="activity-scheduled-time"
          aria-label="Activity time"
          type="time"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <input
        id={`${fieldPrefix}-estimated-cost`}
        name="activity-estimated-cost"
        aria-label="Activity estimated cost"
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
