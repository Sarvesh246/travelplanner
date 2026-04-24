"use client";

import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number | string;
  onChange: (value: number) => void;
  currency?: string;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function CurrencyInput({
  value,
  onChange,
  currency = "USD",
  placeholder = "0.00",
  className,
  label,
}: CurrencyInputProps) {
  const symbol =
    currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency;

  return (
    <div>
      {label && (
        <label className="text-sm font-medium block mb-1.5">{label}</label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
          {symbol}
        </span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow",
            className
          )}
        />
      </div>
    </div>
  );
}
