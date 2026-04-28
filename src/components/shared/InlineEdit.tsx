"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
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
}

export function InlineEdit({
  value,
  onSave,
  placeholder = "Click to edit",
  className,
  multiline = false,
  canEdit = true,
  displayClassName,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

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
      <span className="inline-flex max-w-full flex-wrap items-center gap-x-1 gap-y-0.5">
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className={cn(
            "max-w-full text-left text-sm hover:bg-muted/60 rounded px-1 -ml-1 py-0.5 transition-colors border border-transparent hover:border-border/50",
            !value && "text-muted-foreground italic",
            displayClassName
          )}
        >
          {value || placeholder}
        </button>
        {statusUi}
      </span>
    );
  }

  const sharedProps = {
    ref: inputRef as React.Ref<HTMLInputElement>,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onBlur: () => void handleSave(),
    onKeyDown: handleKeyDown,
    className: cn(
      "w-full text-sm bg-background border border-ring rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none",
      className
    ),
  };

  return multiline ? (
    <textarea {...(sharedProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} rows={3} />
  ) : (
    <input {...(sharedProps as React.InputHTMLAttributes<HTMLInputElement>)} type="text" />
  );
}
