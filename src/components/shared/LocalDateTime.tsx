"use client";

import { useEffect, useState } from "react";
import { normalizeTimeZoneLabel } from "@/lib/utils";

interface LocalDateTimeProps {
  value: Date | string;
  className?: string;
  options?: Intl.DateTimeFormatOptions;
}

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

export function LocalDateTime({
  value,
  className,
  options = DEFAULT_OPTIONS,
}: LocalDateTimeProps) {
  const isoValue = value instanceof Date ? value.toISOString() : value;
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    const date = new Date(isoValue);
    setFormatted(
      normalizeTimeZoneLabel(
        new Intl.DateTimeFormat(undefined, options).format(date)
      )
    );
  }, [isoValue, options]);

  return (
    <time
      className={className}
      dateTime={isoValue}
      suppressHydrationWarning
    >
      {formatted ?? ""}
    </time>
  );
}
