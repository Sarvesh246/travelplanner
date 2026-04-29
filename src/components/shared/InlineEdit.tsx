"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Check, AlertCircle, Pencil } from "lucide-react";
import {
  useTripEditingPresenceField,
} from "@/components/collaboration/TripEditingPresenceProvider";
import { EditingPresenceNotice } from "@/components/collaboration/EditingPresenceNotice";
import { cn } from "@/lib/utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  canEdit?: boolean;
  displayClassName?: string;
  /** Shows a pencil next to the label when idle so editing is discoverable (e.g. hero titles). */
  showEditIcon?: boolean;
  /** Accessible name for the edit control (used as aria-label and title). */
  editLabel?: string;
  presence?: {
    surfaceId: string;
    surfaceLabel: string;
    resourceId: string;
    resourceLabel: string;
    fieldKey: string;
    fieldLabel: string;
  };
}

export function InlineEdit({
  value,
  onSave,
  placeholder = "Click to edit",
  className,
  multiline = false,
  canEdit = true,
  displayClassName,
  showEditIcon = false,
  editLabel = "Edit",
  presence,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const presenceField = useTripEditingPresenceField(presence ?? null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) {
      presenceField?.clear();
    }
  }, [editing, presenceField]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  async function handleSave() {
    const next = draft.trim();
    if (next === value) {
      setEditing(false);
      setStatus("idle");
      return;
    }
    setStatus("saving");
    setEditing(false);
    try {
      await onSave(next);
      setStatus("saved");
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setDraft(value);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setStatus("idle"), 3500);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      void handleSave();
    }
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
      setStatus("idle");
    }
  }

  const statusUi =
    status !== "idle" && !editing ? (
      <span
        className={cn(
          "ml-1 inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums",
          status === "saving" && "text-muted-foreground",
          status === "saved" && "text-success",
          status === "error" && "text-destructive"
        )}
        aria-live="polite"
      >
        {status === "saving" && (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving
          </>
        )}
        {status === "saved" && (
          <>
            <Check className="h-3 w-3" />
            Saved
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="h-3 w-3" />
            Failed
          </>
        )}
      </span>
    ) : null;

  if (!canEdit) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-sm", displayClassName)}>
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </span>
    );
  }

  if (!editing) {
    return (
      <span className="inline-flex max-w-full flex-wrap items-start gap-x-1 gap-y-0.5">
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(true);
            presenceField?.activate();
          }}
          aria-label={editLabel}
          title={editLabel}
          className={cn(
            "group max-w-full text-left text-sm hover:bg-muted/60 rounded px-1 -ml-1 py-0.5 transition-colors border border-transparent hover:border-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55",
            showEditIcon && "inline-flex items-start gap-3.5 sm:gap-4 rounded-lg py-1 sm:items-center",
            !value && "text-muted-foreground italic",
            displayClassName
          )}
        >
          <span className="min-w-0 flex-1">{value || placeholder}</span>
          {showEditIcon ? (
            <span
              className="inline-flex shrink-0 rounded-md border border-transparent bg-muted/55 p-1.5 text-muted-foreground ring-1 ring-border/70 transition-[color,background-color,border-color] duration-200 group-hover:border-primary/35 group-hover:bg-primary/10 group-hover:text-primary md:p-1"
              aria-hidden
            >
              <Pencil className="h-4 w-4 shrink-0 md:h-3.5 md:w-3.5" strokeWidth={2.25} />
            </span>
          ) : null}
        </button>
        {statusUi}
        {presence ? (
          <EditingPresenceNotice
            editors={presenceField.fieldEditors}
            className="ml-1"
          />
        ) : null}
      </span>
    );
  }

  const sharedProps = {
    ref: inputRef as React.Ref<HTMLInputElement>,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      {
        setDraft(e.target.value);
        presenceField?.activate();
      },
    onBlur: () => {
      presenceField?.clear();
      void handleSave();
    },
    onKeyDown: handleKeyDown,
    onFocus: () => presenceField?.activate(),
    onSelect: () => presenceField?.activate(),
    className: cn(
      "w-full text-sm bg-background border border-ring rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none",
      className
    ),
  };

  return (
    <div className="space-y-1.5">
      {multiline ? (
        <textarea
          {...(sharedProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          rows={3}
        />
      ) : (
        <input
          {...(sharedProps as React.InputHTMLAttributes<HTMLInputElement>)}
          type="text"
        />
      )}
      {presence ? (
        <EditingPresenceNotice editors={presenceField.fieldEditors} />
      ) : null}
    </div>
  );
}
