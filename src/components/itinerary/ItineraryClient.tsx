"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Map, Plus, Loader2, X } from "lucide-react";
import { StopList } from "./StopList";
import { StopDetailPanel } from "./StopDetailPanel";
import { useTripContext } from "@/components/trip/TripContext";
import { createStop } from "@/actions/itinerary";
import { toast } from "sonner";
import type { StopSerialized } from "./types";

interface ItineraryClientProps {
  tripId: string;
  stops: StopSerialized[];
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
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createStop(tripId, {
        name: name.trim(),
        country: country.trim() || undefined,
        arrivalDate: arrivalDate || undefined,
        departureDate: departureDate || undefined,
      });
      toast.success("Stop added");
      setName("");
      setCountry("");
      setArrivalDate("");
      setDepartureDate("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add stop");
    } finally {
      setLoading(false);
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
            <label className="text-sm font-medium block mb-1.5">Stop name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kyoto, Japan"
              autoFocus
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Country</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Japan"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Arrival</label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Departure</label>
              <input
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
