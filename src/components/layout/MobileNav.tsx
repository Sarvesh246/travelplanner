"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, Package, Receipt, Vote, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { isTripItinerarySection } from "@/lib/nav/trip-sections";

interface MobileNavProps {
  tripId: string;
}

const navItems = (tripId: string) => [
  { href: ROUTES.tripOverview(tripId), label: "Overview", mobileLabel: "Summary", icon: LayoutDashboard },
  { href: ROUTES.tripItinerary(tripId), label: "Itinerary", mobileLabel: "Route", icon: Map },
  { href: ROUTES.tripSupplies(tripId), label: "Supplies", mobileLabel: "Gear", icon: Package },
  { href: ROUTES.tripExpenses(tripId), label: "Expenses", mobileLabel: "Costs", icon: Receipt },
  { href: ROUTES.tripVotes(tripId), label: "Votes", mobileLabel: "Votes", icon: Vote },
  { href: ROUTES.tripMembers(tripId), label: "Members", mobileLabel: "Crew", icon: Users },
];

export function MobileNav({ tripId }: MobileNavProps) {
  const pathname = usePathname();
  const items = navItems(tripId);

  return (
    <nav
      className="app-mobile-nav fixed bottom-0 left-0 right-0 z-40 border-t border-border/75 bg-background/92 shadow-[0_-14px_36px_-30px_hsl(var(--primary)/0.7)] backdrop-blur-xl md:hidden"
      aria-label="Trip sections"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-6 gap-1 px-[max(0.35rem,env(safe-area-inset-left,0px))] pb-[max(0.35rem,env(safe-area-inset-bottom,0px))] pr-[max(0.35rem,env(safe-area-inset-right,0px))] pt-1.5">
        {items.map((item) => {
          const itineraryHref = ROUTES.tripItinerary(tripId);
          const isActive =
            item.href === itineraryHref
              ? isTripItinerarySection(pathname, tripId)
              : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
              className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[9px] font-medium leading-none transition-colors",
                isActive
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-1 h-1 w-1 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)]" aria-hidden />
              )}
              <Icon className="h-[1.1rem] w-[1.1rem] shrink-0" />
              <span className="min-w-0 truncate">{item.mobileLabel ?? item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
