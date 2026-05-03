"use client";

import { useRef } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

type DatePillFieldProps = {
  value: string;
  min?: string;
  onChange: (next: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  ariaLabel: string;
  className?: string;
  children: React.ReactNode;
};

export function DatePillField({
  value,
  min,
  onChange,
  onFocus,
  onBlur,
  ariaLabel,
  className,
  children,
}: DatePillFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.showPicker?.();
  }

  return (
    <label
      className={cn(
        "relative flex min-h-12 min-w-0 cursor-pointer items-center gap-2 rounded-xl border border-border/75 bg-card/70 px-3 py-2 text-sm transition-colors duration-200 hover:bg-card/85 focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-ring/30",
        className
      )}
      onClick={openPicker}
    >
      <div className="pointer-events-none flex min-w-0 flex-1 items-center gap-2">
        {children}
      </div>
      <CalendarDays className="pointer-events-none h-4 w-4 shrink-0 text-muted-foreground/85" aria-hidden />
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-label={ariaLabel}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}
