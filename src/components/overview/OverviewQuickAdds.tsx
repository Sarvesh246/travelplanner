"use client";

import Link from "next/link";
import { MapPin, Receipt, Users, Package } from "lucide-react";
import { ROUTES } from "@/lib/constants";

const items = (tripId: string) =>
  [
    { href: ROUTES.tripItinerary(tripId), label: "Add stop", sub: "Itinerary", icon: MapPin },
    { href: ROUTES.tripExpenses(tripId), label: "Add expense", sub: "Expenses", icon: Receipt },
    { href: ROUTES.tripMembers(tripId), label: "Invite member", sub: "Members", icon: Users },
    { href: ROUTES.tripSupplies(tripId), label: "Add supply", sub: "Supplies", icon: Package },
  ] as const;

export function OverviewQuickAdds({ tripId }: { tripId: string }) {
  const links = items(tripId);
  return (
    <section className="rounded-2xl border border-border/65 bg-muted/35 p-3 dark:bg-muted/20">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Quick paths</p>
      <div className="grid grid-cols-2 gap-2 min-[620px]:grid-cols-4">
        {links.map(({ href, label, sub, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="app-hover-lift flex min-h-[4.125rem] flex-col rounded-xl border border-border/65 bg-[hsl(var(--card)/0.88)] p-3 text-left shadow-sm backdrop-blur-sm transition-colors duration-200 hover:border-primary/30 hover:bg-primary/[0.04] dark:bg-card/60"
          >
            <Icon className="mb-2 h-[18px] w-[18px] text-primary" aria-hidden />
            <span className="truncate text-[13px] font-semibold text-foreground">{label}</span>
            <span className="truncate text-[11px] text-muted-foreground">{sub}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
