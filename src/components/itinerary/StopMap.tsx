"use client";

import dynamic from "next/dynamic";
import { StopMapEmpty } from "@/components/itinerary/StopMapEmpty";

export interface StopMapProps {
  name: string;
  lat: number | null;
  lon: number | null;
  editable?: boolean;
  onChange?: (coords: { lat: number; lon: number } | null) => void;
  className?: string;
  canEdit?: boolean;
  onRequestEdit?: () => void;
  /** Shorter tile for narrow drawers; pair with grid row height in parent. */
  compact?: boolean;
  /** Default off — StopMapSummary already explains the pin. */
  showCaption?: boolean;
}

const StopMapClient = dynamic(() => import("./StopMapClient").then((mod) => mod.StopMapClient), {
  ssr: false,
  loading: () => <StopMapEmpty variant="skeleton" />,
});

export function StopMap({
  lat,
  lon,
  editable,
  canEdit,
  onRequestEdit,
  name,
  onChange,
  className,
  compact = false,
  showCaption = false,
}: StopMapProps) {
  const hasCoords = lat != null && lon != null;
  const showEmpty = !hasCoords && !editable;

  if (showEmpty) {
    return (
      <StopMapEmpty
        variant={canEdit ? "cta" : "static"}
        onAddLocation={canEdit ? onRequestEdit : undefined}
        className={className}
        compact={compact}
      />
    );
  }

  return (
    <StopMapClient
      name={name}
      lat={lat}
      lon={lon}
      editable={editable ?? false}
      onChange={onChange}
      compact={compact}
      showCaption={showCaption}
      className={className}
    />
  );
}
