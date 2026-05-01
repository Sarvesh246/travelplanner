"use client";

import { useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StopCard } from "./StopCard";
import { reorderStops } from "@/actions/itinerary";
import { useTripContext } from "@/components/trip/TripContext";
import { toast } from "sonner";
import type { StopSerialized } from "./types";

interface StopListProps {
  tripId: string;
  stops: StopSerialized[];
  selectedStopId?: string | null;
  onSelectStop: (id: string) => void;
}

export function StopList({ tripId, stops, selectedStopId, onSelectStop }: StopListProps) {
  const { canEdit } = useTripContext();
  const [items, setItems] = useState(stops);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((s) => s.id === active.id);
    const newIndex = items.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    try {
      await reorderStops(tripId, next.map((s) => s.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reorder stops. Please try again.");
      setItems(items);
    }
  }

  // Keep local state in sync when server pushes a new list
  if (stops !== items && stops.length !== items.length) {
    setItems(stops);
  }

  function handleListKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const active = document.activeElement as HTMLElement | null;
    const index = items.findIndex((item) => buttonRefs.current[item.id] === active);
    if (index < 0) return;
    e.preventDefault();
    const nextIndex =
      e.key === "ArrowDown"
        ? Math.min(items.length - 1, index + 1)
        : Math.max(0, index - 1);
    const next = items[nextIndex];
    if (next) {
      onSelectStop(next.id);
      buttonRefs.current[next.id]?.focus();
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div
          className="relative min-w-0 max-w-full space-y-3 pl-5 before:absolute before:left-2 before:top-5 before:bottom-5 before:w-px before:bg-gradient-to-b before:from-primary/15 before:via-primary/45 before:to-primary/15"
          onKeyDown={handleListKeyDown}
        >
          {items.map((stop, index) => (
            <SortableStop
              key={stop.id}
              tripId={tripId}
              stop={stop}
              index={index}
              selected={selectedStopId === stop.id}
              canReorder={canEdit}
              onSelect={() => onSelectStop(stop.id)}
              onButtonRef={(el) => {
                buttonRefs.current[stop.id] = el;
              }}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableStop({
  tripId,
  stop,
  index,
  selected,
  canReorder,
  onSelect,
  onButtonRef,
}: {
  tripId: string;
  stop: StopSerialized;
  index: number;
  selected: boolean;
  canReorder: boolean;
  onSelect: () => void;
  onButtonRef: (el: HTMLButtonElement | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stop.id,
    disabled: !canReorder,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div id={`trip-stop-${stop.id}`} ref={setNodeRef} style={style} className="min-w-0 max-w-full">
      <StopCard
        tripId={tripId}
        stop={stop}
        index={index}
        selected={selected}
        onSelect={onSelect}
        onButtonRef={onButtonRef}
        dragHandleProps={canReorder ? { ...attributes, ...listeners } : undefined}
      />
    </div>
  );
}
