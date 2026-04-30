"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StickyActionBar } from "@/components/layout/StickyActionBar";
import { Map, Plus, Loader2, X, Users, Package } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { StopList } from "./StopList";
import { StopDetailPanel } from "./StopDetailPanel";
import { StopDetailView } from "./StopDetailView";
import { ItineraryFloatingControls } from "./ItineraryFloatingControls";
import { useTripContext } from "@/components/trip/TripContext";
import { createStop } from "@/actions/itinerary";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLoading } from "@/hooks/useLoading";
import type { StopSerialized } from "./types";

interface ItineraryClientProps {
  tripId: string;
  stops: StopSerialized[];
}

interface LocationSuggestion {
  placeId: string;
  label: string;
  lat: number;
  lon: number;
}

interface NominatimResult {
  place_id?: number;
  osm_id?: number;
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
}

export function ItineraryClient({ tripId, stops }: ItineraryClientProps) {
  const { canEdit } = useTripContext();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    function handleResize() {
      setDesktop(window.innerWidth >= 768);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const hasExplicitSelection =
    selectedStopId != null && stops.some((s) => s.id === selectedStopId);
  const mobileSelectedStop = hasExplicitSelection
    ? stops.find((s) => s.id === selectedStopId) ?? null
    : null;
  const desktopSelectedStop =
    mobileSelectedStop ?? stops[0] ?? null;
  const listSelectedStopId = desktop
    ? (desktopSelectedStop?.id ?? null)
    : (mobileSelectedStop?.id ?? null);

  return (
    <>
      <PageHeader
        eyebrow="Route plan"
        title="Itinerary"
        description={`${stops.length} stop${stops.length !== 1 ? "s" : ""} planned`}
        actions={
          canEdit && stops.length > 0 && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="app-hover-lift hidden md:inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Stop
            </button>
          )
        }
      />

      {stops.length === 0 ? (
        <EmptyState
          icon={<Map className="w-7 h-7" />}
          title="No stops yet"
          description="Add your first stop to start building the route."
          action={
            <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="app-hover-lift inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 min-h-11 text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add first stop
                </button>
              )}
              <Link
                href={ROUTES.tripOverview(tripId)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 min-h-11 text-sm font-medium text-foreground transition-colors hover:bg-muted/70"
              >
                Trip overview
              </Link>
              <Link
                href={ROUTES.tripSupplies(tripId)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 min-h-11 text-sm font-medium text-foreground transition-colors hover:bg-muted/70"
              >
                <Package className="h-4 w-4 shrink-0" /> Supplies
              </Link>
              <Link
                href={ROUTES.tripMembers(tripId)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 min-h-11 text-sm font-medium text-foreground transition-colors hover:bg-muted/70"
              >
                <Users className="h-4 w-4 shrink-0" /> Members
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)] md:items-start">
          <StopList
            tripId={tripId}
            stops={stops}
            selectedStopId={listSelectedStopId}
            onSelectStop={(id) => setSelectedStopId(id)}
          />
          <aside className="hidden min-w-0 md:block md:self-start">
            {desktopSelectedStop ? (
              <div className="app-surface sticky top-0 flex h-[calc(100dvh-4.75rem)] max-h-[calc(100dvh-4.75rem)] min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80">
                <StopDetailView
                  stop={desktopSelectedStop}
                  tripId={tripId}
                  layout="drawer"
                  onCloseDrawer={() => setSelectedStopId(null)}
                />
              </div>
            ) : (
              <div className="app-surface rounded-2xl border border-border/80 p-5 text-sm text-muted-foreground">
                Select a stop to view details.
              </div>
            )}
          </aside>
        </div>
      )}

      <AddStopDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        tripId={tripId}
        onLocateStop={(stopId) => {
          setSelectedStopId(stopId);
          requestAnimationFrame(() => {
            const prefers =
              typeof window !== "undefined" &&
              window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            document.getElementById(`trip-stop-${stopId}`)?.scrollIntoView({
              behavior: prefers ? "instant" : "smooth",
              block: "center",
            });
          });
        }}
      />

      <ItineraryFloatingControls />

      <StopDetailPanel
        stop={mobileSelectedStop}
        open={!!mobileSelectedStop && !desktop}
        onOpenChange={(v) => !v && setSelectedStopId(null)}
      />

      {canEdit && stops.length > 0 ? (
        <StickyActionBar
          primary={
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add stop
            </button>
          }
        />
      ) : null}
    </>
  );
}

function AddStopDialog({
  open,
  onOpenChange,
  tripId,
  onLocateStop,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  onLocateStop?: (stopId: string) => void;
}) {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [loading, setLoading] = useState(false);
  const stopNameId = "stop-name";
  const stopLocationId = "stop-location";
  const stopArrivalId = "stop-arrival-date";
  const stopDepartureId = "stop-departure-date";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    startLoading("Adding stop...");
    try {
      const { stop } = await createStop(tripId, {
        name: name.trim(),
        country: country.trim() || undefined,
        latitude: selectedLocation?.lat,
        longitude: selectedLocation?.lon,
        placeId: selectedLocation?.placeId,
        arrivalDate: arrivalDate || undefined,
        departureDate: departureDate || undefined,
      });
      await router.refresh();
      setName("");
      setCountry("");
      setSelectedLocation(null);
      setArrivalDate("");
      setDepartureDate("");
      onOpenChange(false);
      toast.success(`Added “${stop.name}”`, {
        description: "Your route list is updated below.",
        action: onLocateStop
          ? {
              label: "View",
              onClick: () => onLocateStop(stop.id),
            }
          : undefined,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add this stop. Please try again.");
    } finally {
      setLoading(false);
      stopLoading();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative mt-auto flex max-h-[min(92dvh,38rem)] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-xl sm:mt-0 sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border p-5 sm:p-6">
          <h2 className="font-semibold text-base">Add stop</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[min(72dvh,28rem)] space-y-4 overflow-y-auto overscroll-contain p-5 pt-4 sm:p-6 sm:pt-4">
          <div>
            <label htmlFor={stopNameId} className="text-sm font-medium block mb-1.5">
              Stop name *
            </label>
            <input
              id={stopNameId}
              name="stop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kyoto, Japan"
              autoFocus
              className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base sm:min-h-10 sm:text-sm touch-manipulation focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <LocationAutocomplete
            id={stopLocationId}
            name="stop-location"
            value={country}
            onChange={(value) => {
              setCountry(value);
              setSelectedLocation(null);
            }}
            onSelect={setSelectedLocation}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={stopArrivalId} className="text-sm font-medium block mb-1.5">
                Arrival
              </label>
              <input
                id={stopArrivalId}
                name="stop-arrival-date"
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base sm:min-h-10 sm:text-sm touch-manipulation focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor={stopDepartureId} className="text-sm font-medium block mb-1.5">
                Departure
              </label>
              <input
                id={stopDepartureId}
                name="stop-departure-date"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                min={arrivalDate}
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base sm:min-h-10 sm:text-sm touch-manipulation focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 touch-manipulation"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Add stop
          </button>
        </form>
      </div>
    </div>
  );
}

function LocationAutocomplete({
  id,
  name,
  value,
  onChange,
  onSelect,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: LocationSuggestion | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedQueryRef = useRef("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const query = value.trim();

    if (query.length < 3 || query === selectedQueryRef.current) {
      setSuggestions([]);
      setOpen(false);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: query });
        const response = await fetch(`/api/locations/search?${params}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        if (!response.ok) throw new Error("Location search failed");

        const results = (await response.json()) as NominatimResult[];
        const next = results
          .map((result) => {
            const lat = Number.parseFloat(result.lat ?? "");
            const lon = Number.parseFloat(result.lon ?? "");
            const label = result.display_name ?? result.name;
            const placeId = String(result.place_id ?? result.osm_id ?? label ?? "");

            if (!label || !Number.isFinite(lat) || !Number.isFinite(lon) || !placeId) {
              return null;
            }

            return { placeId, label, lat, lon };
          })
          .filter((result): result is LocationSuggestion => result !== null);

        setSuggestions(next);
        setOpen(inputRef.current === document.activeElement && next.length > 0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  function handlePick(suggestion: LocationSuggestion) {
    selectedQueryRef.current = suggestion.label;
    onChange(suggestion.label);
    onSelect(suggestion);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="text-sm font-medium block mb-1.5">
        Location
      </label>
      <input
        ref={inputRef}
        id={id}
        name={name}
        value={value}
        onChange={(e) => {
          selectedQueryRef.current = "";
          onChange(e.target.value);
        }}
        onFocus={() => setOpen(suggestions.length > 0)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder="Search a city, park, hotel, or address"
        autoComplete="off"
        className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base sm:min-h-10 sm:text-sm touch-manipulation focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {searching && (
        <Loader2 className="absolute right-3 top-[38px] h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {open && (
        <div className="absolute z-[60] mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lg">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handlePick(suggestion)}
              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
            >
              <span className="line-clamp-2">{suggestion.label}</span>
            </button>
          ))}
          <p className="px-3 py-1.5 text-[10px] text-muted-foreground">
            Results from OpenStreetMap
          </p>
        </div>
      )}
    </div>
  );
}
