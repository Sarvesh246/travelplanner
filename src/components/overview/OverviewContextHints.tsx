"use client";

import Link from "next/link";
import { useTripContext } from "@/components/trip/TripContext";
import { ROUTES } from "@/lib/constants";

export function OverviewContextHints({ tripId }: { tripId: string }) {
  const { trip, members } = useTripContext();
  const lines: { msg: React.ReactNode; key: string }[] = [];

  if (!trip.startDate) {
    lines.push({
      key: "dates",
      msg: (
        <>
          <span aria-hidden>· </span>Set trip dates to anchor itineraries and countdowns —{" "}
          <Link className="underline-offset-4 hover:text-foreground underline" href={`${ROUTES.tripOverview(tripId)}#trip-dates`}>
            overview
          </Link>
          .
        </>
      ),
    });
  }
  if ((members?.length ?? 0) >= 2 && trip.startDate) {
    lines.push({
      key: "after-members",
      msg: (
        <>
          <span aria-hidden>· </span>Solid crew — consider splitting gear on{" "}
          <Link className="underline-offset-4 hover:text-foreground underline" href={ROUTES.tripSupplies(tripId)}>
            Supplies
          </Link>{" "}
          or settling plans with a{" "}
          <Link className="underline-offset-4 hover:text-foreground underline" href={ROUTES.tripVotes(tripId)}>
            poll
          </Link>
          .
        </>
      ),
    });
  }

  if (lines.length === 0) return null;

  return (
    <div className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.04] px-3 py-3 text-xs leading-snug text-muted-foreground backdrop-blur-sm transition-colors duration-300 dark:bg-primary/[0.07] md:text-[13px]">
      <p className="mb-1 font-semibold text-foreground/90">Next steps</p>
      <ul className="space-y-1">
        {lines.map((l) => (
          <li key={l.key}>{l.msg}</li>
        ))}
      </ul>
    </div>
  );
}
