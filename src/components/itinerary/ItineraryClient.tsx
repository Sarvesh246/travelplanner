"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Map, Plus, Loader2, X } from "lucide-react";
import { StopList } from "./StopList";
import { StopDetailPanel } from "./StopDetailPanel";
import { useTripContext } from "@/components/trip/TripContext";
import { createStop } from "@/actions/itinerary";
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

  const selectedStop = stops.find((s) => s.id === selectedStopId) ?? null;

  return (
    <>
      <PageHeader
        title="Itinerary"
        description={`${stops.length} stop${stops.length !== 1 ? "s" : ""} planned`}
        actions={
          canEdit && (
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
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
            canEdit && (
              <button
                onClick={() => setAddOpen(true)}
                className="mt-2 flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add first stop
              </button>
            )
          }
        />
      ) : (
        <StopList
          tripId={tripId}
          stops={stops}
          onSelectStop={(id) => setSelectedStopId(id)}
        />
      )}

      <AddStopDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        tripId={tripId}
      />

      <StopDetailPanel
        stop={selectedStop}
        open={!!selectedStop}
        onOpenChange={(v) => !v && setSelectedStopId(null)}
      />
    </>
  );
}

function AddStopDialog({
  open,
  onOpenChange,
  tripId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
}) {
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
      await createStop(tripId, {
        name: name.trim(),
        country: country.trim() || undefined,
        latitude: selectedLocation?.lat,
        longitude: selectedLocation?.lon,
        placeId: selectedLocation?.placeId,
        arrivalDate: arrivalDate || undefined,
        departureDate: departureDate || undefined,
      });
      toast.success("Stop added");
      setName("");
      setCountry("");
      setSelectedLocation(null);
      setArrivalDate("");
      setDepartureDate("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add stop");
    } finally {
      setLoading(false);
      stopLoading();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-semibold text-base">Add stop</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
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
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
