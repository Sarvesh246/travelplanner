"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StopMap } from "@/components/itinerary/StopMap";
import { StopLocationHeader } from "@/components/itinerary/StopLocationHeader";
import { StopMapSummary } from "@/components/itinerary/StopMapSummary";
import { updateStop } from "@/actions/itinerary";
import { cn } from "@/lib/utils";

export function StopLocationSection({
  stopId,
  stopName,
  latitude,
  longitude,
  placeId,
  canEdit,
  onDirtyChange,
  className,
  compact = false,
}: {
  stopId: string;
  stopName: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  canEdit: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  className?: string;
  /** Tighter map + padding for itinerary drawer / narrow columns. */
  compact?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draftCoords, setDraftCoords] = useState<{ lat: number; lon: number } | null>(
    latitude != null && longitude != null ? { lat: latitude, lon: longitude } : null
  );
  const [saving, setSaving] = useState(false);

  const hasSavedLocation = latitude != null && longitude != null;

  const isDirty = useMemo(() => {
    if (draftCoords == null && latitude == null && longitude == null) return false;
    if (draftCoords == null || latitude == null || longitude == null) return true;
    return draftCoords.lat !== latitude || draftCoords.lon !== longitude;
  }, [draftCoords, latitude, longitude]);

  const headerDisplayCoords = useMemo(() => {
    if (editing) return draftCoords;
    if (latitude != null && longitude != null) return { lat: latitude, lon: longitude };
    return null;
  }, [editing, draftCoords, latitude, longitude]);

  const mapLat = draftCoords?.lat ?? null;
  const mapLon = draftCoords?.lon ?? null;

  useEffect(() => {
    onDirtyChange?.(isDirty || editing);
  }, [isDirty, editing, onDirtyChange]);

  async function saveLocation() {
    setSaving(true);
    try {
      await updateStop(stopId, {
        latitude: draftCoords?.lat ?? null,
        longitude: draftCoords?.lon ?? null,
        placeId:
          draftCoords == null
            ? null
            : placeId ?? `manual:${draftCoords.lat.toFixed(6)},${draftCoords.lon.toFixed(6)}`,
      });
      await router.refresh();
      setEditing(false);
      toast.success(draftCoords ? "Stop location updated" : "Stop location cleared");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this stop location.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing() {
    setDraftCoords(latitude != null && longitude != null ? { lat: latitude, lon: longitude } : null);
    setEditing(false);
  }

  function resetDraftToSaved() {
    setDraftCoords(latitude != null && longitude != null ? { lat: latitude, lon: longitude } : null);
  }

  const handleUseCurrent = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported in this browser.");
      return;
    }
    setEditing(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraftCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lon: Number(pos.coords.longitude.toFixed(6)),
        });
        toast.success("Marker placed from your current location.");
      },
      () => {
        toast.error("Could not read your location. Check browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 }
    );
  }, []);

  const handleRemove = useCallback(() => {
    setEditing(true);
    if (draftCoords === null && hasSavedLocation) {
      return;
    }
    if (draftCoords === null && !hasSavedLocation) {
      return;
    }
    if (hasSavedLocation) {
      if (!window.confirm("Remove this stop’s saved location from the map? Save to apply.")) {
        return;
      }
      setDraftCoords(null);
      return;
    }
    setDraftCoords(null);
  }, [draftCoords, hasSavedLocation]);

  return (
    <section
      className={cn(
        "app-surface-soft relative rounded-2xl border border-border/80 bg-card/60 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)] transition-shadow duration-200",
        compact ? "mb-0 w-full p-3 pb-2" : "mb-5 p-4 pb-2",
        className
      )}
    >
      <div className={cn("flex flex-wrap items-center gap-2", compact ? "mb-1.5" : "mb-2")}>
        <h3 className={cn("font-semibold tracking-tight text-foreground", compact ? "text-xs uppercase tracking-wide text-muted-foreground" : "text-sm")}>
          Stop map
        </h3>
        {isDirty ? (
          <span className="inline-flex items-center rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">
            Unsaved changes
          </span>
        ) : null}
      </div>

      {!hasSavedLocation && !editing ? (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-foreground">Add a location</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Used for the map preview and forecast.
            </p>
          </div>
          {canEdit ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
            >
              Add location
            </button>
          ) : null}
        </div>
      ) : null}

      <StopLocationHeader
        stopName={stopName}
        displayCoords={headerDisplayCoords}
        hasSavedLocation={hasSavedLocation}
        canEdit={canEdit}
        editing={editing}
        onEdit={() => setEditing(true)}
        onUseCurrent={handleUseCurrent}
        onRemove={handleRemove}
      />

      <StopMap
        name={stopName}
        lat={mapLat}
        lon={mapLon}
        editable={editing}
        onChange={editing ? setDraftCoords : undefined}
        canEdit={canEdit}
        onRequestEdit={() => setEditing(true)}
        compact={compact}
      />

      <StopMapSummary className={compact ? "mt-1.5" : undefined} lat={mapLat} lon={mapLon} />

      {canEdit && editing ? (
        <div
          className={cn(
            "sticky bottom-0 z-10 mt-3 border-t border-border/60 bg-gradient-to-t from-card via-card/95 to-transparent pt-3",
            compact ? "-mx-3.5 px-3.5 pb-3.5" : "-mx-4 px-4 pb-4"
          )}
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={resetDraftToSaved}
              disabled={!hasSavedLocation}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-background/70 px-3 text-xs font-semibold text-muted-foreground transition-colors duration-200 hover:bg-muted/60 hover:text-foreground disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-background/70 px-3 text-xs font-semibold text-muted-foreground transition-colors duration-200 hover:bg-muted/60 hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || !isDirty}
              onClick={() => void saveLocation()}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save location
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
