"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair } from "lucide-react";
import L, { type DivIcon } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { StopMapProps } from "./StopMap";

const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795];

function markerIcon(): DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<span style="display:block;width:18px;height:18px;border-radius:999px;background:hsl(154 39% 34%);border:3px solid rgba(244,246,242,0.92);box-shadow:0 0 0 4px rgba(47,93,80,0.16),0 8px 18px rgba(15,23,42,0.22);"></span>`,
  });
}

const stopMarkerIcon = markerIcon();

function useIsNarrowMobile() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return narrow;
}

function MapViewportSync({
  center,
  goalZoom,
}: {
  center: [number, number];
  goalZoom: number;
}) {
  const map = useMap();
  const skipFlyRef = useRef(true);

  useEffect(() => {
    const current = map.getZoom();
    const nextZoom = Number.isFinite(goalZoom) ? Math.max(current, goalZoom) : current;
    if (skipFlyRef.current) {
      skipFlyRef.current = false;
      map.setView(center, nextZoom, { animate: false });
      return;
    }
    map.flyTo(center, nextZoom, { duration: 0.45 });
  }, [center, goalZoom, map]);

  return null;
}

function ClickToPlaceMarker({
  editable,
  position,
  onChange,
}: {
  editable: boolean;
  position: { lat: number; lon: number } | null;
  onChange?: (coords: { lat: number; lon: number } | null) => void;
}) {
  useMapEvents({
    click(event) {
      if (!editable || !onChange) return;
      onChange({
        lat: Number(event.latlng.lat.toFixed(6)),
        lon: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  if (!position) return null;

  return (
    <Marker
      draggable={editable}
      icon={stopMarkerIcon}
      position={[position.lat, position.lon]}
      eventHandlers={
        editable && onChange
          ? {
              dragend(event) {
                const marker = event.target;
                const next = marker.getLatLng();
                onChange({
                  lat: Number(next.lat.toFixed(6)),
                  lon: Number(next.lng.toFixed(6)),
                });
              },
            }
          : undefined
      }
    />
  );
}

function EditModeOverlay({
  visible,
  hintVisible,
}: {
  visible: boolean;
  hintVisible: boolean;
}) {
  if (!visible) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[800]">
      {hintVisible ? (
        <div className="absolute left-1/2 top-3 z-[801] max-w-[min(90%,20rem)] -translate-x-1/2 rounded-full border border-border/70 bg-card/90 px-3 py-1.5 text-center text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-opacity duration-500">
          Tap to place marker · drag to fine-tune
        </div>
      ) : null}
      <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-primary/35">
        <Crosshair className="h-10 w-10" strokeWidth={1.25} aria-hidden />
      </div>
    </div>
  );
}

export function StopMapClient({
  name,
  lat,
  lon,
  editable = false,
  onChange,
  className,
  compact = false,
  showCaption = false,
}: StopMapProps) {
  const isMobile = useIsNarrowMobile();
  const [hintDismissed, setHintDismissed] = useState(false);

  useEffect(() => {
    if (!editable) {
      setHintDismissed(false);
      return;
    }
    const timer = window.setTimeout(() => setHintDismissed(true), 4000);
    return () => window.clearTimeout(timer);
  }, [editable]);

  const wrappedOnChange = useMemo(() => {
    if (!onChange) return undefined;
    return (coords: { lat: number; lon: number } | null) => {
      setHintDismissed(true);
      onChange(coords);
    };
  }, [onChange]);

  const position = useMemo(
    () => (lat != null && lon != null ? { lat, lon } : null),
    [lat, lon]
  );
  const center = useMemo<[number, number]>(() => {
    if (position) return [position.lat, position.lon];
    return DEFAULT_CENTER;
  }, [position]);

  const initialZoom = useMemo(() => {
    if (position) return isMobile ? 13 : 11;
    if (editable) return 5;
    return 4;
  }, [position, editable, isMobile]);

  const goalZoom = useMemo(() => {
    if (!position) return editable ? 5 : 4;
    if (editable) return Math.max(isMobile ? 13 : 11, 12);
    return isMobile ? 13 : 11;
  }, [position, editable, isMobile]);

  const tile =
    (compact ? "aspect-[16/9] min-h-[140px] max-h-[min(32dvh,240px)]" : "aspect-[16/9] min-h-[220px] max-h-[min(52dvh,340px)]") +
    (editable ? " [&_.leaflet-container]:cursor-crosshair" : "");

  return (
    <div className={className}>
      <div className={`relative w-full overflow-hidden rounded-2xl border border-border bg-muted/20 ${tile}`}>
        <MapContainer
          center={center}
          zoom={initialZoom}
          className="absolute inset-0 h-full w-full"
          scrollWheelZoom={false}
          attributionControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewportSync center={center} goalZoom={goalZoom} />
          <ClickToPlaceMarker editable={editable} position={position} onChange={wrappedOnChange} />
        </MapContainer>
        <EditModeOverlay visible={editable} hintVisible={!hintDismissed} />
      </div>
      {showCaption && !editable ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Approximate stop location for {name} from OpenStreetMap.
        </p>
      ) : null}
    </div>
  );
}
