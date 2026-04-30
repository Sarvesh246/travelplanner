"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Circle, Clock, Edit3, Loader2, Save, Trash2, X } from "lucide-react";
import { cn, deriveDurationMins, formatCurrency, formatTimeRange } from "@/lib/utils";
import { ACTIVITY_STATUS_COLORS, ACTIVITY_STATUS_LABELS } from "@/lib/constants";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { InlineEdit } from "@/components/shared/InlineEdit";
import { deleteActivity, updateActivity } from "@/actions/itinerary";
import { toast } from "sonner";
import { ActivityStatus } from "@prisma/client";
import type { ActivitySerialized } from "./types";

interface ActivityRowProps {
  activity: ActivitySerialized;
  canEdit: boolean;
  onDirtyChange?: (key: string, dirty: boolean) => void;
}

const STATUSES: ActivityStatus[] = ["IDEA", "OPTION", "PLANNED", "CONFIRMED", "COMPLETED", "CANCELLED"];

export function ActivityRow({ activity, canEdit, onDirtyChange }: ActivityRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(activity.scheduledDate?.slice(0, 10) ?? "");
  const [startTime, setStartTime] = useState(activity.startTime ?? "");
  const [endTime, setEndTime] = useState(activity.endTime ?? "");
  const [estimatedCost, setEstimatedCost] = useState(
    activity.estimatedCost != null ? activity.estimatedCost.toString() : ""
  );

  const computedDurationMins = useMemo(
    () => deriveDurationMins(startTime || undefined, endTime || undefined),
    [endTime, startTime]
  );
  const dirtyKey = `activity:${activity.id}`;
  const activityErrors: string[] = [];
  const isDirty =
    scheduledDate !== (activity.scheduledDate?.slice(0, 10) ?? "") ||
    startTime !== (activity.startTime ?? "") ||
    endTime !== (activity.endTime ?? "") ||
    estimatedCost !== (activity.estimatedCost != null ? activity.estimatedCost.toString() : "");

  if ((startTime && !endTime) || (!startTime && endTime)) {
    activityErrors.push("Start and end time need to be set together.");
  }
  if (startTime && endTime && computedDurationMins == null) {
    activityErrors.push("End time cannot be before start time.");
  }

  useEffect(() => {
    if (!editing) {
      onDirtyChange?.(dirtyKey, false);
      return;
    }
    onDirtyChange?.(dirtyKey, isDirty);
    return () => onDirtyChange?.(dirtyKey, false);
  }, [dirtyKey, editing, isDirty, onDirtyChange]);

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
        scheduledDate: scheduledDate || null,
        startTime: startTime || null,
        endTime: endTime || null,
        durationMins: computedDurationMins,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
      });
      setEditing(false);
      setShowSaved(true);
      window.setTimeout(() => setShowSaved(false), 1800);
      onDirtyChange?.(dirtyKey, false);
      toast.success("Activity updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update this activity. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const timeLabel = formatTimeRange(activity.startTime, activity.endTime);

  function handleCancel() {
    if (isDirty && !window.confirm("Discard your activity changes?")) return;
    setScheduledDate(activity.scheduledDate?.slice(0, 10) ?? "");
    setStartTime(activity.startTime ?? "");
    setEndTime(activity.endTime ?? "");
    setEstimatedCost(activity.estimatedCost != null ? activity.estimatedCost.toString() : "");
    setEditing(false);
    onDirtyChange?.(dirtyKey, false);
  }

  return (
    <>
      <div className="group relative py-2 pl-8">
        <div className="absolute left-3 top-4 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-primary/40 bg-background transition-colors group-hover:border-primary" />
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <InlineEdit
                value={activity.name}
                onSave={handleRename}
                canEdit={canEdit}
                displayClassName="font-medium text-sm leading-6"
              />
              <div className="relative justify-self-start sm:justify-self-end">
                <button
                  type="button"
                  onClick={() => canEdit && setStatusOpen(!statusOpen)}
                  disabled={!canEdit}
                  className={cn(
                    "inline-flex min-h-7 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] transition-colors",
                    ACTIVITY_STATUS_COLORS[activity.status],
                    canEdit && "hover:opacity-80 cursor-pointer"
                  )}
                >
                  <Circle className="w-2 h-2 fill-current" />
                  {ACTIVITY_STATUS_LABELS[activity.status]}
                </button>
                {statusOpen && canEdit && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                    <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-xl border border-border bg-popover py-1 shadow-lg sm:left-auto sm:right-0">
                      {STATUSES.filter((s) => s !== activity.status).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatus(status)}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                        >
                          {ACTIVITY_STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
              {timeLabel && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <Clock className="w-3 h-3" />
                  {timeLabel}
                </span>
              )}
              {activity.durationMins !== null && <span className="whitespace-nowrap">{activity.durationMins} min</span>}
              {activity.estimatedCost !== null && <span className="whitespace-nowrap">{formatCurrency(activity.estimatedCost)}</span>}
              {showSaved && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap text-success">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              )}
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
            <label className="space-y-1">
              <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Date
              </span>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                aria-label="Activity date"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Start time
                </span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  aria-label="Start time"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="space-y-1">
                <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  End time
                </span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  aria-label="End time"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Duration
                </span>
                <div className="flex min-h-10 items-center rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                  {computedDurationMins != null ? `${computedDurationMins} min` : "Calculated from start and end"}
                </div>
              </label>
              <label className="space-y-1">
                <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Estimated cost
                </span>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="Estimated cost"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            </div>
            {activityErrors.length > 0 && (
              <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <ul className="space-y-1">
                  {activityErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || activityErrors.length > 0}
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
