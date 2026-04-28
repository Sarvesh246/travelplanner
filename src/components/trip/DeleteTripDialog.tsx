"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const portalTarget = typeof document === "undefined" ? null : document.body;

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

  useEffect(() => {
    if (!open || !portalTarget) return;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    inputRef.current?.select();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, portalTarget]);

  const canConfirm = typed.trim() === tripName.trim() && !loading;

  async function handleDelete(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
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

  if (!open || !portalTarget) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-trip-title"
    >
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={closeDialog}
      />
      <form
        onSubmit={handleDelete}
        className="relative flex w-full max-w-2xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/95 shadow-2xl ring-1 ring-black/10"
      >
        <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/12">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 id="delete-trip-title" className="text-lg font-semibold sm:text-xl">
                Delete this trip forever?
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground sm:text-[15px]">
                This action is{" "}
                <span className="font-semibold text-destructive">permanent</span> and{" "}
                <span className="font-semibold text-destructive">cannot be undone</span>.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-muted/45 p-4 sm:p-5">
            <p className="mb-2 text-sm font-semibold text-foreground sm:text-base">
              Everything below will be erased from the database:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm leading-6 text-muted-foreground sm:text-[15px]">
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
            className="mt-6 block text-sm font-medium leading-6"
          >
            To confirm, type{" "}
            <span className="break-all font-mono text-foreground">{tripName}</span>.
          </label>
          <input
            id="delete-trip-confirm"
            ref={inputRef}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={tripName}
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
            className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
            Press Enter once the trip name matches exactly.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border/80 bg-card/98 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={closeDialog}
            disabled={loading}
            className="rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canConfirm}
            aria-disabled={!canConfirm}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl bg-destructive px-5 py-3 text-sm font-medium text-destructive-foreground transition-colors",
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
      </form>
    </div>
    ,
    portalTarget
  );
}
