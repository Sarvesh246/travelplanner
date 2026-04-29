"use client";

import { useState } from "react";
import { Clock, Trash2, Circle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ACTIVITY_STATUS_COLORS } from "@/lib/constants";
import { InlineEdit } from "@/components/shared/InlineEdit";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { updateActivity, deleteActivity } from "@/actions/itinerary";
import { toast } from "sonner";
import { ActivityStatus } from "@prisma/client";
import type { ActivitySerialized } from "./types";

interface ActivityRowProps {
  activity: ActivitySerialized;
  canEdit: boolean;
}

const STATUSES: ActivityStatus[] = ["IDEA", "PLANNED", "CONFIRMED", "COMPLETED", "CANCELLED"];

export function ActivityRow({ activity, canEdit }: ActivityRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  async function handleRename(name: string) {
    try {
      await updateActivity(activity.id, { name });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not rename this activity. Please try again.");
      throw err;
    }
  }

  async function handleStatus(status: ActivityStatus) {
    setStatusOpen(false);
    try {
      await updateActivity(activity.id, { status });
      toast.success(`Marked ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update this activity. Please try again.");
    }
  }

  async function handleDelete() {
    try {
      await deleteActivity(activity.id);
      toast.success("Activity removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove this activity. Please try again.");
    }
  }

  return (
    <>
      <div className="group relative flex items-start gap-3 py-2">
        <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full bg-background border-2 border-primary/40 group-hover:border-primary transition-colors" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <InlineEdit
              value={activity.name}
              onSave={handleRename}
              canEdit={canEdit}
              displayClassName="font-medium text-sm"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => canEdit && setStatusOpen(!statusOpen)}
                disabled={!canEdit}
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors",
                  ACTIVITY_STATUS_COLORS[activity.status],
                  canEdit && "hover:opacity-80 cursor-pointer"
                )}
              >
                <Circle className="w-2 h-2 fill-current" />
                {activity.status}
              </button>
              {statusOpen && canEdit && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                  <div className="absolute top-full mt-1 left-0 w-36 bg-popover border border-border rounded-xl shadow-lg py-1 z-20">
                    {STATUSES.filter((s) => s !== activity.status).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatus(status)}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            {activity.scheduledTime && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {activity.scheduledTime}
              </span>
            )}
            {activity.durationMins !== null && (
              <span>{activity.durationMins} min</span>
            )}
            {activity.estimatedCost !== null && (
              <span>{formatCurrency(activity.estimatedCost)}</span>
            )}
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label="Delete activity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${activity.name}"?`}
        description="This will remove the activity from this stop."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </>
  );
}
