"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTrip } from "@/actions/trips";
import { cn } from "@/lib/utils";

interface DeleteTripDialogProps {
  tripId: string;
  tripName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Navigate to this route after a successful deletion. Defaults to the
   * dashboard. Pass `null` to just refresh the current page (useful when the
   * caller is already on the dashboard).
   */
  redirectTo?: string | null;
}

export function DeleteTripDialog({
  tripId,
  tripName,
  open,
  onOpenChange,
  redirectTo = null,
}: DeleteTripDialogProps) {
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function closeDialog() {
    if (loading) return;
    setTyped("");
    onOpenChange(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        setTyped("");
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onOpenChange]);

  const canConfirm = typed.trim() === tripName.trim() && !loading;

  async function handleDelete() {
    if (!canConfirm) return;
    setLoading(true);
    try {
      await deleteTrip(tripId);
      toast.success(`"${tripName}" was permanently deleted`);
      onOpenChange(false);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not delete this trip"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-trip-title"
    >
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={closeDialog}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="delete-trip-title" className="text-base font-semibold">
              Delete this trip?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This action is{" "}
              <span className="font-semibold text-destructive">permanent</span>{" "}
              and{" "}
              <span className="font-semibold text-destructive">
                cannot be undone
              </span>
              .
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">
            Everything below will be erased from the database:
          </p>
          <ul className="list-inside list-disc space-y-0.5">
            <li>All stops, stays, and activities</li>
            <li>Expenses, splits, and settlements</li>
            <li>Supplies and assignments</li>
            <li>Votes, options, and responses</li>
            <li>Comments on every item</li>
            <li>Trip members and pending invites</li>
            <li>Uploaded cover images</li>
          </ul>
        </div>

        <label
          htmlFor="delete-trip-confirm"
          className="mt-4 block text-xs font-medium"
        >
          To confirm, type{" "}
          <span className="font-mono text-foreground break-all">
            {tripName}
          </span>{" "}
          below:
        </label>
        <input
          id="delete-trip-confirm"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={tripName}
          autoFocus
          disabled={loading}
          autoComplete="off"
          spellCheck={false}
          className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        />

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={closeDialog}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canConfirm}
            aria-disabled={!canConfirm}
            className={cn(
              "flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors",
              "hover:bg-destructive/90",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete forever
          </button>
        </div>
      </div>
    </div>
  );
}
