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
  { href: ROUTES.tripMembers(tripId), label: "Members", mobileLabel: "Members", icon: Users },
];

export function MobileNav({ tripId }: MobileNavProps) {
  const pathname = usePathname();
  const items = navItems(tripId);

  return (
    <nav
      className="app-mobile-nav fixed bottom-0 left-0 right-0 z-40 border-t border-border/75 bg-background/92 shadow-[0_-14px_36px_-30px_hsl(var(--primary)/0.7)] backdrop-blur-xl md:hidden"
      aria-label="Trip sections"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-6 gap-0.5 px-[max(0.3rem,env(safe-area-inset-left,0px))] pb-[max(0.18rem,env(safe-area-inset-bottom,0px))] pr-[max(0.3rem,env(safe-area-inset-right,0px))] pt-1">
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
                "app-tap relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium leading-none transition-colors min-[390px]:text-[10.5px]",
                isActive
                  ? "bg-primary/16 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-0.5 h-1 w-1 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)]" aria-hidden />
              )}
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  isActive ? "bg-primary/14" : "bg-transparent"
                )}
              >
                <Icon className="h-[1.28rem] w-[1.28rem] shrink-0 min-[390px]:h-[1.36rem] min-[390px]:w-[1.36rem]" />
              </span>
              <span className="min-w-0 truncate">{item.mobileLabel ?? item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
