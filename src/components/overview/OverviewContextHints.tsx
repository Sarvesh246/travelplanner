"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useTripContext } from "@/components/trip/TripContext";
import { ROUTES } from "@/lib/constants";

export function OverviewContextHints({ tripId }: { tripId: string }) {
  const { trip, members } = useTripContext();
  const [dismissed, setDismissed] = useState(false);

  const lines = useMemo(() => {
    const nextLines: { msg: React.ReactNode; key: string }[] = [];

    if (!trip.startDate) {
      nextLines.push({
        key: "dates",
        msg: (
          <>
            <span aria-hidden>&middot; </span>Set trip dates to anchor itineraries and countdowns -{" "}
            <Link
              className="underline underline-offset-4 hover:text-foreground"
              href={`${ROUTES.tripOverview(tripId)}#trip-dates`}
            >
              overview
            </Link>
            .
          </>
        ),
      });
    }

    if ((members?.length ?? 0) >= 2 && trip.startDate) {
      nextLines.push({
        key: "after-members",
        msg: (
          <>
            <span aria-hidden>&middot; </span>Solid crew - consider splitting gear on{" "}
            <Link
              className="underline underline-offset-4 hover:text-foreground"
              href={ROUTES.tripSupplies(tripId)}
            >
              Supplies
            </Link>{" "}
            or settling plans with a{" "}
            <Link
              className="underline underline-offset-4 hover:text-foreground"
              href={ROUTES.tripVotes(tripId)}
            >
              poll
            </Link>
            .
          </>
        ),
      });
    }

    return nextLines;
  }, [members, trip.startDate, tripId]);

  const storageKey = useMemo(
    () =>
      `beacon:overview-next-steps:${tripId}:${lines
        .map((line) => line.key)
        .join("|")}`,
    [lines, tripId]
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (lines.length === 0) {
        setDismissed(false);
        return;
      }

      try {
        setDismissed(window.localStorage.getItem(storageKey) === "1");
      } catch {
        setDismissed(false);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [lines.length, storageKey]);

  if (lines.length === 0 || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore storage failures */
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.04] px-3 py-3 text-xs leading-snug text-muted-foreground backdrop-blur-sm transition-colors duration-300 dark:bg-primary/[0.07] md:text-[13px]">
      <div className="mb-1 flex items-start justify-between gap-3">
        <p className="font-semibold text-foreground/90">Next steps</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss next steps"
          className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors duration-200 hover:bg-muted/70 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <ul className="space-y-1">
        {lines.map((line) => (
          <li key={line.key}>{line.msg}</li>
        ))}
      </ul>
    </div>
  );
}
