"use client";

import { useEffect, useMemo, useState } from "react";
import { LocateFixed, MapPin, Pencil, Trash2 } from "lucide-react";

export type StopLocationHeaderProps = {
  stopName: string;
  /** Coordinates shown in the header (while editing, reflects draft including explicit clear). */
  displayCoords: { lat: number; lon: number } | null;
  hasSavedLocation: boolean;
  canEdit: boolean;
  editing: boolean;
  onEdit: () => void;
  onUseCurrent: () => void;
  onRemove: () => void;
};

function useSecureGeolocationAvailable() {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.isSecureContext || window.location.hostname === "localhost";
  }, []);
}

export function StopLocationHeader({
  stopName,
  displayCoords,
  hasSavedLocation,
  canEdit,
  editing,
  onEdit,
  onUseCurrent,
  onRemove,
}: StopLocationHeaderProps) {
  const showGeo = useSecureGeolocationAvailable();
  const [reverseLabel, setReverseLabel] = useState<string | null>(null);
  const [labelLoading, setLabelLoading] = useState(false);

  const coordsLine =
    displayCoords != null
      ? `${displayCoords.lat.toFixed(4)}, ${displayCoords.lon.toFixed(4)}`
      : null;

  /** Place label is only shown for viewers — editors use buttons only (coords stay in Stop map summary). */
  useEffect(() => {
    if (canEdit || !displayCoords) {
      setReverseLabel(null);
      setLabelLoading(false);
      return;
    }

    const controller = new AbortController();
    setLabelLoading(true);
    const params = new URLSearchParams({
      lat: String(displayCoords.lat),
      lon: String(displayCoords.lon),
    });

    fetch(`/api/locations/reverse?${params}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 204) return null;
        if (!response.ok) return null;
        const data = (await response.json()) as { label?: string };
        return typeof data.label === "string" ? data.label : null;
      })
      .then(setReverseLabel)
      .catch(() => setReverseLabel(null))
      .finally(() => setLabelLoading(false));

    return () => controller.abort();
  }, [canEdit, displayCoords?.lat, displayCoords?.lon]);

  const title = reverseLabel?.trim() || stopName;

  if (!canEdit && !coordsLine) {
    return (
      <div className="mb-3 rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        No map location for this stop.
      </div>
    );
  }

  if (canEdit) {
    return (
      <div className="mb-3 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 rounded-xl border border-border/80 bg-background/50 px-3 py-2.5">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted/70 hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit
        </button>
        {showGeo ? (
          <button
            type="button"
            onClick={onUseCurrent}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted/70 hover:text-foreground"
          >
            <LocateFixed className="h-3.5 w-3.5" aria-hidden />
            Use current
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          disabled={
            (!displayCoords && !hasSavedLocation) ||
            (editing && displayCoords === null && hasSavedLocation)
          }
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-xl border border-border/80 bg-background/50 px-3 py-2.5">
      <div className="min-w-0 overflow-hidden">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        {labelLoading && displayCoords ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground animate-pulse">Looking up place…</p>
        ) : coordsLine ? (
          <p className="mt-0.5 flex items-start gap-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
            <MapPin className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            <span title={coordsLine}>{coordsLine}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
