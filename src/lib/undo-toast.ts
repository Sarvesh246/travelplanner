"use client";

import { performUndo } from "@/actions/undo";
import { toast } from "sonner";

/** Sonner toast with a one-tap undo that runs server-side rollback (see `performUndo`). */
export function toastBulkUndo(message: string, undoTokenIds: string[], description?: string) {
  if (undoTokenIds.length === 0) {
    toast.success(message, description ? { description } : undefined);
    return;
  }
  toast.success(message, {
    description,
    duration: 9000,
    action: {
      label: undoTokenIds.length > 1 ? "Undo all" : "Undo",
      onClick: () => {
        void (async () => {
          try {
            await Promise.all(undoTokenIds.map((id) => performUndo(id)));
            toast.message("Restored invites");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not undo all");
          }
        })();
      },
    },
  });
}

export function toastWithUndo(
  message: string,
  undoTokenId: string | null | undefined,
  description?: string
) {
  if (!undoTokenId) {
    toast.success(message, description ? { description } : undefined);
    return;
  }
  toast.success(message, {
    description,
    duration: 8500,
    action: {
      label: "Undo",
      onClick: () => {
        void (async () => {
          try {
            await performUndo(undoTokenId);
            toast.message("Restored previous state");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not undo");
          }
        })();
      },
    },
  });
}
