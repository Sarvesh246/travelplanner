"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bed,
  CalendarDays,
  ChevronDown,
  MapPin,
  Maximize2,
  Plus,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { cn, deriveDurationMins, formatDateRange } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { StayCard } from "./StayCard";
import { DayTimeline } from "./DayTimeline";
import { createStay, createActivity, deleteStop, restoreStop, updateStop } from "@/actions/itinerary";
import { useTripContext } from "@/components/trip/TripContext";
import {
  useTripEditingPresenceField,
} from "@/components/collaboration/TripEditingPresenceProvider";
import { EditingPresenceNotice } from "@/components/collaboration/EditingPresenceNotice";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import { StopLocationSection } from "./StopLocationSection";
import type { StopDetailTab, StopSerialized } from "./types";

function StopDateFields({
  stopId,
  arrivalDate,
  departureDate,
  canEdit,
  isPage,
}: {
  stopId: string;
  arrivalDate: string | null;
  departureDate: string | null;
  canEdit: boolean;
  isPage: boolean;
}) {
  const router = useRouter();
  const [arrive, setArrive] = useState(() => arrivalDate?.slice(0, 10) ?? "");
  const [depart, setDepart] = useState(() => departureDate?.slice(0, 10) ?? "");
  const arriveRef = useRef(arrive);
  const departRef = useRef(depart);
  arriveRef.current = arrive;
  departRef.current = depart;

  useEffect(() => {
    setArrive(arrivalDate?.slice(0, 10) ?? "");
    setDepart(departureDate?.slice(0, 10) ?? "");
  }, [arrivalDate, departureDate, stopId]);

  const labelCls = isPage ? "text-sm" : "text-xs";

  if (!canEdit && !arrivalDate && !departureDate) {
    return null;
  }

  if (!canEdit) {
    return (
      <p className={`mt-0.5 text-muted-foreground ${labelCls}`}>
        {formatDateRange(arrivalDate, departureDate)}
      </p>
    );
  }

  async function save(nextArrive: string, nextDepart: string) {
    try {
      await updateStop(stopId, {
        arrivalDate: nextArrive || null,
        departureDate: nextDepart || null,
      });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update stop dates");
      setArrive(arrivalDate?.slice(0, 10) ?? "");
      setDepart(departureDate?.slice(0, 10) ?? "");
    }
  }

  return (
    <div className={`mt-2 space-y-1.5 ${labelCls}`}>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex min-w-0 items-center gap-2 rounded-xl border border-border/75 bg-card/70 px-3 py-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-muted-foreground">Arrive</span>
          <input
            type="date"
            value={arrive}
            onChange={(e) => {
              const v = e.target.value;
              setArrive(v);
              void save(v, departRef.current);
            }}
            className="min-w-0 flex-1 bg-transparent outline-none"
            aria-label="Stop arrival date"
          />
        </label>
        <label className="flex min-w-0 items-center gap-2 rounded-xl border border-border/75 bg-card/70 px-3 py-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-muted-foreground">Depart</span>
          <input
            type="date"
            value={depart}
            min={arrive || undefined}
            onChange={(e) => {
              const v = e.target.value;
              setDepart(v);
              void save(arriveRef.current, v);
            }}
            className="min-w-0 flex-1 bg-transparent outline-none"
            aria-label="Stop departure date"
          />
        </label>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Shown on the route list and used for forecasts. Updates when stays change check-in/out; editable anytime.
      </p>
    </div>
  );
}

export type StopDetailLayout = "drawer" | "page";

type StopDetailViewProps = {
  stop: StopSerialized;
  tripId: string;
  layout: StopDetailLayout;
  initialTab?: StopDetailTab;
  onCloseDrawer?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
};

export function StopDetailView({ stop, tripId, layout, initialTab = "stays", onCloseDrawer, onDirtyChange }: StopDetailViewProps) {
  const { canEdit } = useTripContext();
  const router = useRouter();
  const [tab, setTab] = useState<StopDetailTab>(initialTab);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});

  const isPage = layout === "page";
  const hasUnsavedChanges = useMemo(() => Object.values(dirtyMap).some(Boolean), [dirtyMap]);

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  function registerDirty(key: string, dirty: boolean) {
    setDirtyMap((current) => {
      if (dirty && current[key]) return current;
      if (!dirty && !current[key]) return current;
      if (!dirty) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: true };
    });
  }

  function closeIfDrawer() {
    if (hasUnsavedChanges && !window.confirm("Discard your unsaved stop changes?")) return;
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
    <div className="min-w-0 flex-1">
      {isPage ? (
        <h1 className="text-balance text-xl font-semibold tracking-tight sm:text-2xl">{stop.name}</h1>
      ) : (
        <h2 className="line-clamp-2 break-words text-lg font-semibold leading-snug tracking-tight" title={stop.name}>
          {stop.name}
        </h2>
      )}
      {stop.country && (
        <p
          className={`mt-0.5 flex min-w-0 items-start gap-1.5 break-words text-muted-foreground ${
            isPage ? "text-sm" : "text-xs"
          }`}
        >
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="min-w-0">{stop.country}</span>
        </p>
      )}
      <StopDateFields
        stopId={stop.id}
        arrivalDate={stop.arrivalDate}
        departureDate={stop.departureDate}
        canEdit={canEdit}
        isPage={isPage}
      />
    </div>
  );

  const actionButtons = (
    <div className="flex items-center gap-1 shrink-0">
      {!isPage && (
        <Link
          href={ROUTES.tripStop(tripId, stop.id)}
          onClick={(event) => {
            if (hasUnsavedChanges && !window.confirm("Discard your unsaved stop changes?")) {
              event.preventDefault();
              return;
            }
            onCloseDrawer?.();
          }}
          className="min-h-10 min-w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
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
          className="min-h-10 min-w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
          aria-label="Delete stop"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      {!isPage && (
        <button
          type="button"
          onClick={closeIfDrawer}
          className="min-h-10 min-w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors duration-200"
          aria-label="Close stop details"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const locationSection = (
    <StopLocationSection
      key={`stop-location:${stop.id}:${stop.latitude ?? "none"}:${stop.longitude ?? "none"}:${stop.placeId ?? "none"}`}
      stopId={stop.id}
      stopName={stop.name}
      latitude={stop.latitude}
      longitude={stop.longitude}
      placeId={stop.placeId}
      canEdit={canEdit}
      compact={!isPage}
      onDirtyChange={(dirty) => registerDirty("location", dirty)}
      className={isPage ? undefined : "mb-2"}
    />
  );

  const tabStrip = (
    <div
      className={cn(
        "flex shrink-0 gap-px border-b border-border/85 bg-muted/20 px-1 pt-1",
        !isPage && "[&_button]:py-2.5"
      )}
    >
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
  );

  const tabPanel = (
    <div
      className={
        isPage
          ? "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pt-5 pb-10 [scrollbar-gutter:stable]"
          : "flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-y-auto overscroll-y-contain px-4 pt-2.5 [scrollbar-gutter:stable] scroll-pb-2 pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))] md:scroll-pb-3 md:px-5 md:pb-3 md:pt-4"
      }
    >
      {tab === "stays" && <StaysTab stop={stop} canEdit={canEdit} onDirtyChange={registerDirty} />}
      {tab === "activities" && <ActivitiesTab stop={stop} canEdit={canEdit} onDirtyChange={registerDirty} />}
    </div>
  );

  /**
   * Drawer: flex column (more reliable than grid `1fr` + min-height quirks on mobile WebKit).
   * Map stack stays short (scrollable) so Stays / Activities gets most of the drawer height.
   */
  const body = isPage ? (
    <>
      {locationSection}
      {tabStrip}
      {tabPanel}
    </>
  ) : (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 max-h-[min(24dvh,9.875rem)] shrink-0 overflow-y-auto overscroll-y-contain border-b border-border/40 px-4 pb-1 pt-1.5 [scrollbar-gutter:stable] sm:max-h-[min(28dvh,11.625rem)] md:max-h-[min(34dvh,15.25rem)] md:px-5 md:pb-1.5 md:pt-2">
        {locationSection}
      </div>
      {tabStrip}
      {tabPanel}
    </div>
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
                  className="min-h-10 min-w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
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

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-start gap-3 border-b border-border/80 px-4 py-2.5 sm:px-5 sm:py-3.5 md:py-4">
        {titleBlock}
        {actionButtons}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {body}
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
      className={cn(
        "relative flex flex-1 items-center justify-center gap-2 rounded-t-xl py-3.5 text-sm transition-colors transition-[background-color,box-shadow] duration-200 [&_svg]:shrink-0",
        active
          ? "z-[1] font-semibold text-foreground bg-muted/55 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.07)] dark:bg-muted/40 dark:text-foreground [&_svg]:text-primary [&_svg]:opacity-100"
          : "font-medium text-muted-foreground/90 hover:z-[1] hover:text-foreground hover:bg-muted/30 [&_svg]:opacity-65 hover:[&_svg]:opacity-90"
      )}
    >
      {children}
      {active && (
        <motion.div
          layoutId={`stop-detail-tab-${layoutIdSuffix}`}
          className="pointer-events-none absolute bottom-0 left-1 right-1 h-[3px] rounded-full bg-primary shadow-[0_0_14px_-1px_hsl(var(--primary)/0.65)] dark:shadow-[0_0_18px_-2px_hsl(var(--primary)/0.55)]"
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        />
      )}
    </button>
  );
}

function InlineErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      <ul className="space-y-1">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  );
}

function SecondaryFields({
  open,
  onOpenChange,
  label = "More details",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/40">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span>{label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-3 border-t border-border/80 p-3">{children}</div>}
    </div>
  );
}

function StaysTab({
  stop,
  canEdit,
  onDirtyChange,
}: {
  stop: StopSerialized;
  canEdit: boolean;
  onDirtyChange: (key: string, dirty: boolean) => void;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col min-h-0 flex-1 space-y-2">
      {stop.stays.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground text-center py-6">No stays yet.</p>
      )}
      {stop.stays.map((stay) => (
        <StayCard key={stay.id} stay={stay} canEdit={canEdit} onDirtyChange={onDirtyChange} />
      ))}
      {adding && (
        <AddStayForm
          stopId={stop.id}
          onDone={() => setAdding(false)}
          onDirtyChange={onDirtyChange}
        />
      )}
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

function ActivitiesTab({
  stop,
  canEdit,
  onDirtyChange,
}: {
  stop: StopSerialized;
  canEdit: boolean;
  onDirtyChange: (key: string, dirty: boolean) => void;
}) {
  const [adding, setAdding] = useState(false);
  const previousActivityDate =
    stop.activities
      .slice()
      .reverse()
      .find((activity) => activity.scheduledDate)?.scheduledDate ?? null;

  return (
    <div className="flex flex-col min-h-0 flex-1 space-y-2">
      <DayTimeline activities={stop.activities} canEdit={canEdit} onDirtyChange={onDirtyChange} />
      {adding && (
        <AddActivityForm
          stopId={stop.id}
          fallbackDate={previousActivityDate}
          onDone={() => setAdding(false)}
          onDirtyChange={onDirtyChange}
        />
      )}
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

function AddStayForm({
  stopId,
  onDone,
  onDirtyChange,
}: {
  stopId: string;
  onDone: () => void;
  onDirtyChange: (key: string, dirty: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [roomSiteInput, setRoomSiteInput] = useState("");
  const [roomSiteNumbers, setRoomSiteNumbers] = useState<string[]>([]);
  const [arrivalTime, setArrivalTime] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [leaveTime, setLeaveTime] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const fieldPrefix = `stay-${stopId}`;
  const surfaceId = `stop-stay:${stopId}`;
  const dirtyKey = `add-stay:${stopId}`;
  const namePresence = useTripEditingPresenceField({
    surfaceId,
    surfaceLabel: "Add stay",
    resourceId: `stay:${stopId}`,
    resourceLabel: "New stay",
    fieldKey: "name",
    fieldLabel: "stay name",
  });

  const normalizedSites = roomSiteNumbers.map((value) => value.trim().toLowerCase()).filter(Boolean);
  const pendingSite = roomSiteInput.trim().toLowerCase();
  const duplicatePendingSite = pendingSite.length > 0 && normalizedSites.includes(pendingSite);
  const stayErrors: string[] = [];
  const isDirty =
    name.trim().length > 0 ||
    address.trim().length > 0 ||
    roomSiteInput.trim().length > 0 ||
    roomSiteNumbers.length > 0 ||
    arrivalTime.length > 0 ||
    checkIn.length > 0 ||
    checkInTime.length > 0 ||
    checkOut.length > 0 ||
    checkOutTime.length > 0 ||
    leaveTime.length > 0 ||
    totalPrice.length > 0;

  if ((checkIn && !checkInTime) || (!checkIn && checkInTime)) {
    stayErrors.push("Check-in date and time need to be set together.");
  }
  if ((checkOut && !checkOutTime) || (!checkOut && checkOutTime)) {
    stayErrors.push("Check-out date and time need to be set together.");
  }
  if (checkIn && checkOut && checkOut < checkIn) {
    stayErrors.push("Check-out cannot be before check-in.");
  }
  if (checkIn && checkOut && checkIn === checkOut && checkInTime && checkOutTime && deriveDurationMins(checkInTime, checkOutTime) == null) {
    stayErrors.push("Check-out time cannot be before check-in time on the same day.");
  }
  if (duplicatePendingSite) {
    stayErrors.push("Room or site numbers must be unique.");
  }

  useEffect(() => {
    onDirtyChange(dirtyKey, isDirty);
    return () => onDirtyChange(dirtyKey, false);
  }, [dirtyKey, isDirty, onDirtyChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || stayErrors.length > 0) return;
    setLoading(true);
    try {
      await createStay(stopId, {
        name: name.trim(),
        address: address.trim() || undefined,
        roomSiteNumbers,
        arrivalTime: arrivalTime || undefined,
        checkIn: checkIn || undefined,
        checkInTime: checkInTime || undefined,
        checkOut: checkOut || undefined,
        checkOutTime: checkOutTime || undefined,
        leaveTime: leaveTime || undefined,
        totalPrice: totalPrice ? parseFloat(totalPrice) : undefined,
      });
      toast.success("Stay added");
      onDirtyChange(dirtyKey, false);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add this stay. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function addRoomSiteNumber() {
    const next = roomSiteInput.trim();
    if (!next || duplicatePendingSite) return;
    setRoomSiteNumbers((current) => [...current, next]);
    setRoomSiteInput("");
  }

  function removeRoomSiteNumber(value: string) {
    setRoomSiteNumbers((current) => current.filter((item) => item !== value));
  }

  function handleCancel() {
    if (isDirty && !window.confirm("Discard this new stay?")) return;
    onDirtyChange(dirtyKey, false);
    onDone();
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
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Arrival time
          </span>
          <input
            id={`${fieldPrefix}-arrival-time`}
            name="stay-arrival-time"
            aria-label="Arrival time"
            type="time"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Departure time
          </span>
          <input
            id={`${fieldPrefix}-leave-time`}
            name="stay-leave-time"
            aria-label="Departure time"
            type="time"
            value={leaveTime}
            onChange={(e) => setLeaveTime(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Check-in date
          </span>
          <input
            id={`${fieldPrefix}-check-in`}
            name="stay-check-in"
            aria-label="Check-in date"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Check-in time
          </span>
          <input
            id={`${fieldPrefix}-check-in-time`}
            name="stay-check-in-time"
            aria-label="Check-in time"
            type="time"
            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Check-out date
          </span>
          <input
            id={`${fieldPrefix}-check-out`}
            name="stay-check-out"
            aria-label="Check-out date"
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={checkIn || undefined}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Check-out time
          </span>
          <input
            id={`${fieldPrefix}-check-out-time`}
            name="stay-check-out-time"
            aria-label="Check-out time"
            type="time"
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>
      <InlineErrors errors={stayErrors} />
      <SecondaryFields open={showMoreDetails} onOpenChange={setShowMoreDetails}>
        <input
          id={`${fieldPrefix}-address`}
          name="stay-address"
          aria-label="Stay address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address (optional)"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="rounded-lg border border-border bg-background/70 p-3">
          <div className="flex items-center gap-2">
            <input
              id={`${fieldPrefix}-room-site`}
              name="stay-room-site"
              aria-label="Room or site number"
              value={roomSiteInput}
              onChange={(e) => setRoomSiteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRoomSiteNumber();
                }
              }}
              placeholder="Add room or site number"
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={addRoomSiteNumber}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Add
            </button>
          </div>
          {roomSiteNumbers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {roomSiteNumbers.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => removeRoomSiteNumber(value)}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground transition-colors hover:border-destructive/35 hover:text-destructive"
                >
                  {value} x
                </button>
              ))}
            </div>
          )}
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
      </SecondaryFields>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim() || stayErrors.length > 0}
          className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          Save
        </button>
      </div>
    </form>
  );
}

function AddActivityForm({
  stopId,
  fallbackDate,
  onDone,
  onDirtyChange,
}: {
  stopId: string;
  fallbackDate: string | null;
  onDone: () => void;
  onDirtyChange: (key: string, dirty: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const fieldPrefix = `activity-${stopId}`;
  const surfaceId = `stop-activity:${stopId}`;
  const dirtyKey = `add-activity:${stopId}`;
  const namePresence = useTripEditingPresenceField({
    surfaceId,
    surfaceLabel: "Add activity",
    resourceId: `activity:${stopId}`,
    resourceLabel: "New activity",
    fieldKey: "name",
    fieldLabel: "activity name",
  });
  const derivedDuration = deriveDurationMins(startTime || undefined, endTime || undefined);
  const activityErrors: string[] = [];
  const isDirty =
    name.trim().length > 0 ||
    scheduledDate.length > 0 ||
    startTime.length > 0 ||
    endTime.length > 0 ||
    estimatedCost.length > 0;

  if ((startTime && !endTime) || (!startTime && endTime)) {
    activityErrors.push("Start and end time need to be set together.");
  }
  if (startTime && endTime && derivedDuration == null) {
    activityErrors.push("End time cannot be before start time.");
  }

  useEffect(() => {
    onDirtyChange(dirtyKey, isDirty);
    return () => onDirtyChange(dirtyKey, false);
  }, [dirtyKey, isDirty, onDirtyChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || activityErrors.length > 0) return;
    setLoading(true);
    try {
      await createActivity(stopId, {
        name: name.trim(),
        scheduledDate: scheduledDate || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        durationMins: derivedDuration ?? undefined,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      });
      toast.success("Activity added");
      onDirtyChange(dirtyKey, false);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add this activity. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    if (isDirty && !window.confirm("Discard this new activity?")) return;
    onDirtyChange(dirtyKey, false);
    onDone();
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
      <label className="space-y-1">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Date
        </span>
        <input
          id={`${fieldPrefix}-scheduled-date`}
          name="activity-scheduled-date"
          aria-label="Activity date"
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {!scheduledDate && fallbackDate && (
          <p className="text-[11px] text-muted-foreground">
            Uses the previous activity date by default.
          </p>
        )}
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Start time
          </span>
          <input
            id={`${fieldPrefix}-start-time`}
            name="activity-start-time"
            aria-label="Activity start time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            End time
          </span>
          <input
            id={`${fieldPrefix}-end-time`}
            name="activity-end-time"
            aria-label="Activity end time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Duration
          </span>
          <div className="flex min-h-10 items-center rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
            {derivedDuration != null ? `${derivedDuration} min` : "Calculated from start and end"}
          </div>
        </label>
        <div className="space-y-1">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Save state
          </span>
          <div className="flex min-h-10 items-center rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
            {isDirty ? "Unsaved changes" : "Ready"}
          </div>
        </div>
      </div>
      <InlineErrors errors={activityErrors} />
      <SecondaryFields open={showMoreDetails} onOpenChange={setShowMoreDetails}>
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
      </SecondaryFields>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim() || activityErrors.length > 0}
          className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          Save
        </button>
      </div>
    </form>
  );
}
