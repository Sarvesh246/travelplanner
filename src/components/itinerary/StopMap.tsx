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
}: StopMapProps) {
  const hasCoords = lat != null && lon != null;
  const showEmpty = !hasCoords && !editable;

  if (showEmpty) {
    return (
      <StopMapEmpty
        variant={canEdit ? "cta" : "static"}
        onAddLocation={canEdit ? onRequestEdit : undefined}
        className={className}
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
      className={className}
    />
  );
}
