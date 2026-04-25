"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Package,
  Receipt,
  Vote,
  Users,
  ChevronLeft,
  Plane,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { isTripItinerarySection } from "@/lib/nav/trip-sections";

interface TripSidebarProps {
  tripId: string;
  tripName: string;
}

const navItems = (tripId: string) => [
  { href: ROUTES.tripOverview(tripId), label: "Overview", icon: LayoutDashboard },
  { href: ROUTES.tripItinerary(tripId), label: "Itinerary", icon: Map },
  { href: ROUTES.tripSupplies(tripId), label: "Supplies", icon: Package },
  { href: ROUTES.tripExpenses(tripId), label: "Expenses", icon: Receipt },
  { href: ROUTES.tripVotes(tripId), label: "Votes", icon: Vote },
  { href: ROUTES.tripMembers(tripId), label: "Members", icon: Users },
];

export function TripSidebar({ tripId, tripName }: TripSidebarProps) {
  const pathname = usePathname();
  const items = navItems(tripId);

  return (
    <aside
      className="hidden w-56 min-h-0 shrink-0 flex-col self-stretch overflow-y-auto border-r border-sidebar-border md:flex"
      style={{ background: "hsl(var(--sidebar-bg))" }}
    >
      {/* Back to dashboard */}
      <div className="p-3 border-b border-sidebar-border">
        <Link
          href={ROUTES.dashboard}
          className="flex items-center gap-2 text-xs font-medium px-2 py-1.5 rounded-lg transition-colors"
          style={{ color: "hsl(var(--sidebar-fg) / 0.7)" }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          All trips
        </Link>
      </div>

      {/* Trip name */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Plane className="w-4 h-4 text-primary rotate-45" />
          </div>
          <p
            className="font-semibold text-sm leading-tight truncate"
            style={{ color: "hsl(var(--sidebar-fg))" }}
          >
            {tripName}
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5">
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
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-100",
                isActive
                  ? "text-[hsl(var(--sidebar-accent-fg))]"
                  : "text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-fg)/0.08)]"
              )}
            >
              {isActive && (
                <div
                  className="absolute inset-0 rounded-lg bg-[hsl(var(--sidebar-accent))]"
                  aria-hidden
                />
              )}
              <Icon className="w-4 h-4 shrink-0 relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
