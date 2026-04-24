"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

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
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function handleSave() {
    if (draft.trim() !== value) {
      await onSave(draft.trim());
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  }

  if (!canEdit) {
    return (
      <span className={cn("text-sm", displayClassName)}>
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </span>
    );
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={cn(
          "text-left w-full text-sm hover:bg-muted/60 rounded px-1 -ml-1 py-0.5 transition-colors border border-transparent hover:border-border/50",
          !value && "text-muted-foreground italic",
          displayClassName
        )}
      >
        {value || placeholder}
      </button>
    );
  }

  const sharedProps = {
    ref: inputRef as React.Ref<HTMLInputElement>,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onBlur: handleSave,
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
