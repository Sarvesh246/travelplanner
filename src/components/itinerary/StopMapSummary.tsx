"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type StopMapSummaryProps = {
  lat: number | null;
  lon: number | null;
  className?: string;
};

export function StopMapSummary({ lat, lon, className }: StopMapSummaryProps) {
  const [result, setResult] = useState<{ key: string; label: string | null } | null>(null);
  const reverseKey = lat != null && lon != null ? `${lat.toFixed(6)},${lon.toFixed(6)}` : null;
  const label = result?.key === reverseKey ? result.label : null;
  const loading = reverseKey != null && result?.key !== reverseKey;

  useEffect(() => {
    if (lat == null || lon == null || !reverseKey) return;

    const controller = new AbortController();

    const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
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
      .then((next) => {
        setResult({ key: reverseKey, label: next });
      })
      .catch(() => {
        setResult({ key: reverseKey, label: null });
      });

    return () => controller.abort();
  }, [lat, lon, reverseKey]);

  if (lat == null || lon == null) return null;

  const coords = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

  return (
    <div className={cn("mt-2 space-y-0.5 text-[11px] text-muted-foreground", className)}>
      {loading ? (
        <p className="animate-pulse rounded bg-muted/60 text-transparent">Resolving place name…</p>
      ) : label ? (
        <p className="hyphens-auto break-words text-foreground/90">{label}</p>
      ) : null}
      <p className="font-mono tabular-nums text-muted-foreground">{coords}</p>
      <p className="text-[10px] text-muted-foreground/70">Place name via Nominatim / OSM.</p>
    </div>
  );
}
