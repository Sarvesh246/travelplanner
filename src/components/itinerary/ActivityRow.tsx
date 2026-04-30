"use client";

import { useState } from "react";
import { Circle, Clock, Edit3, Loader2, Save, Trash2, X } from "lucide-react";
import { cn, formatCurrency, formatTimeRange } from "@/lib/utils";
import { ACTIVITY_STATUS_COLORS } from "@/lib/constants";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { InlineEdit } from "@/components/shared/InlineEdit";
import { deleteActivity, updateActivity } from "@/actions/itinerary";
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(activity.scheduledDate?.slice(0, 10) ?? "");
  const [startTime, setStartTime] = useState(activity.startTime ?? "");
  const [endTime, setEndTime] = useState(activity.endTime ?? "");
  const [durationMins, setDurationMins] = useState(
    activity.durationMins != null ? activity.durationMins.toString() : ""
  );
  const [estimatedCost, setEstimatedCost] = useState(
    activity.estimatedCost != null ? activity.estimatedCost.toString() : ""
  );

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

  async function handleSave() {
    setSaving(true);
    try {
      await updateActivity(activity.id, {
        scheduledDate,
        startTime,
        endTime,
        durationMins: durationMins ? parseInt(durationMins, 10) : 0,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : 0,
      });
      setEditing(false);
      toast.success("Activity updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update this activity. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const timeLabel = formatTimeRange(activity.startTime, activity.endTime);

  return (
    <>
      <div className="group relative py-2">
        <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full bg-background border-2 border-primary/40 group-hover:border-primary transition-colors" />
        <div className="flex items-start gap-3">
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
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
              {timeLabel && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeLabel}
                </span>
              )}
              {activity.durationMins !== null && <span>{activity.durationMins} min</span>}
              {activity.estimatedCost !== null && <span>{formatCurrency(activity.estimatedCost)}</span>}
            </div>
          </div>
          {canEdit && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditing((prev) => !prev)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Edit activity details"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label="Delete activity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {editing && canEdit && (
          <div className="mt-3 grid gap-2 rounded-xl border border-border bg-card/60 p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                aria-label="Activity date"
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                aria-label="Start time"
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                aria-label="End time"
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="number"
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
                placeholder="Duration (mins)"
                min="0"
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="Estimated cost"
                step="0.01"
                min="0"
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
          </div>
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
