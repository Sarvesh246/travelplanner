"use client";

import {
  useTripEditingPresenceField,
} from "@/components/collaboration/TripEditingPresenceProvider";
import { EditingPresenceNotice } from "@/components/collaboration/EditingPresenceNotice";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number | string;
  onChange: (value: number) => void;
  currency?: string;
  placeholder?: string;
  className?: string;
  label?: string;
  presence?: {
    surfaceId: string;
    surfaceLabel: string;
    resourceId: string;
    resourceLabel: string;
    fieldKey: string;
    fieldLabel: string;
  };
}

export function CurrencyInput({
  value,
  onChange,
  currency = "USD",
  placeholder = "0.00",
  className,
  label,
  presence,
}: CurrencyInputProps) {
  const presenceField = useTripEditingPresenceField(presence ?? null);
  const symbol =
    currency === "USD"
      ? "$"
      : currency === "EUR"
        ? "\u20AC"
        : currency === "GBP"
          ? "\u00A3"
          : currency;

  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium">{label}</label>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
          {symbol}
        </span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => {
            presenceField.activate();
            onChange(parseFloat(e.target.value) || 0);
          }}
          onFocus={presenceField.activate}
          onBlur={presenceField.clear}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm placeholder:text-muted-foreground transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring",
            className
          )}
        />
      </div>
      {presence ? <EditingPresenceNotice editors={presenceField.fieldEditors} /> : null}
    </div>
  );
}
