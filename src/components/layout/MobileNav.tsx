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
  { href: ROUTES.tripOverview(tripId), label: "Overview", icon: LayoutDashboard },
  { href: ROUTES.tripItinerary(tripId), label: "Itinerary", icon: Map },
  { href: ROUTES.tripSupplies(tripId), label: "Supplies", icon: Package },
  { href: ROUTES.tripExpenses(tripId), label: "Expenses", icon: Receipt },
  { href: ROUTES.tripVotes(tripId), label: "Votes", icon: Vote },
  { href: ROUTES.tripMembers(tripId), label: "Members", icon: Users },
];

export function MobileNav({ tripId }: MobileNavProps) {
  const pathname = usePathname();
  const items = navItems(tripId);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 pb-safe backdrop-blur-md md:hidden"
      aria-label="Trip sections"
    >
      <div className="flex px-[max(0.25rem,env(safe-area-inset-left,0px))] pr-[max(0.25rem,env(safe-area-inset-right,0px))]">
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
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
