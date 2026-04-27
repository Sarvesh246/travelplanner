"use client";

import { useState } from "react";
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
  onSelectStop: (id: string) => void;
}

export function StopList({ tripId, stops, onSelectStop }: StopListProps) {
  const { canEdit } = useTripContext();
  const [items, setItems] = useState(stops);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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
      toast.error(err instanceof Error ? err.message : "Failed to reorder");
      setItems(items);
    }
  }

  // Keep local state in sync when server pushes a new list
  if (stops !== items && stops.length !== items.length) {
    setItems(stops);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="relative space-y-3 pl-5 before:absolute before:left-2 before:top-5 before:bottom-5 before:w-px before:bg-gradient-to-b before:from-primary/15 before:via-primary/45 before:to-primary/15">
          {items.map((stop, index) => (
            <SortableStop
              key={stop.id}
              stop={stop}
              index={index}
              canReorder={canEdit}
              onSelect={() => onSelectStop(stop.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableStop({
  stop,
  index,
  canReorder,
  onSelect,
}: {
  stop: StopSerialized;
  index: number;
  canReorder: boolean;
  onSelect: () => void;
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
    <div ref={setNodeRef} style={style}>
      <StopCard
        stop={stop}
        index={index}
        onSelect={onSelect}
        dragHandleProps={canReorder ? { ...attributes, ...listeners } : undefined}
      />
    </div>
  );
}
