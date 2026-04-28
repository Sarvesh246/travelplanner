"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Package,
  Receipt,
  Vote,
  Users,
  EllipsisVertical,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { isTripItinerarySection } from "@/lib/nav/trip-sections";

interface MobileNavProps {
  tripId: string;
}

type TripNavTab = {
  href: string;
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
};

const PRIMARY = (tripId: string): TripNavTab[] =>
  [
    { href: ROUTES.tripOverview(tripId), label: "Overview", mobileLabel: "Summary", icon: LayoutDashboard },
    { href: ROUTES.tripItinerary(tripId), label: "Itinerary", mobileLabel: "Route", icon: Map },
    { href: ROUTES.tripSupplies(tripId), label: "Supplies", mobileLabel: "Gear", icon: Package },
    { href: ROUTES.tripExpenses(tripId), label: "Expenses", mobileLabel: "Costs", icon: Receipt },
  ];

const MORE_ITEMS = (tripId: string): TripNavTab[] =>
  [
    { href: ROUTES.tripVotes(tripId), label: "Votes", mobileLabel: "Votes", icon: Vote },
    { href: ROUTES.tripMembers(tripId), label: "Members", mobileLabel: "Members", icon: Users },
  ];

export function MobileNav({ tripId }: MobileNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = PRIMARY(tripId);
  const secondary = MORE_ITEMS(tripId);

  function isHrefActive(item: { href: string }) {
    const itineraryHref = ROUTES.tripItinerary(tripId);
    return item.href === itineraryHref
      ? isTripItinerarySection(pathname, tripId)
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const secondaryActive =
    secondary.some((s) =>
      pathname === s.href || pathname.startsWith(`${s.href}/`),
    );

  function renderNavButton(
    item: TripNavTab,
    opts?: { compact?: boolean },
  ) {
    const isActive = isHrefActive(item);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch
        onClick={() => setMoreOpen(false)}
        aria-current={isActive ? "page" : undefined}
        aria-label={item.label}
        title={item.label}
        className={cn(
          opts?.compact
            ? "flex flex-row gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors duration-200"
            : "relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium leading-none transition-colors duration-200 min-[390px]:text-[10.5px]",
          isActive
            ? "bg-primary/16 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        {!opts?.compact && isActive ? (
          <span
            className="absolute top-0.5 h-1 w-1 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)]"
            aria-hidden
          />
        ) : null}
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full transition-colors duration-200",
            opts?.compact ? "h-10 w-10" : "h-9 w-9 min-[390px]:h-[2.375rem] min-[390px]:w-[2.375rem]",
            !opts?.compact && isActive ? "bg-primary/14" : "bg-transparent",
          )}
        >
          <Icon
            className={cn(opts?.compact ? "h-[1.35rem] w-[1.35rem]" : "h-[1.26rem] w-[1.26rem] min-[390px]:h-[1.34rem] min-[390px]:w-[1.34rem]")}
          />
        </span>
        {!opts?.compact ? (
          <span className="min-w-0 truncate">{item.mobileLabel ?? item.label}</span>
        ) : (
          <span>{item.mobileLabel ?? item.label}</span>
        )}
      </Link>
    );
  }

  return (
    <>
      <nav
        className="app-mobile-nav fixed bottom-0 left-0 right-0 z-40 border-t border-border/75 bg-background/92 shadow-[0_-14px_36px_-30px_hsl(var(--primary)/0.7)] backdrop-blur-xl md:hidden"
        aria-label="Trip sections"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1 px-[max(0.3rem,env(safe-area-inset-left,0px))] pb-[max(0.18rem,env(safe-area-inset-bottom,0px))] pr-[max(0.3rem,env(safe-area-inset-right,0px))] pt-1">
          {primary.map((item) => renderNavButton(item))}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            aria-label="More sections: Votes and Members"
            className={cn(
              "app-tap relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium leading-none transition-colors duration-200 min-[390px]:text-[10.5px]",
              secondaryActive
                ? "bg-primary/16 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {secondaryActive && (
              <span
                className="absolute top-0.5 h-1 w-1 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)]"
                aria-hidden
              />
            )}
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 min-[390px]:h-[2.375rem] min-[390px]:w-[2.375rem]",
                secondaryActive ? "bg-primary/14" : "bg-transparent",
              )}
            >
              <EllipsisVertical className="h-[1.26rem] w-[1.26rem] min-[390px]:h-[1.34rem] min-[390px]:w-[1.34rem]" />
            </span>
            <span className="min-w-0 truncate">More</span>
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-[45] md:hidden" aria-hidden={false}>
          <button
            type="button"
            aria-label="Close More menu"
            className="absolute inset-0 bg-foreground/35 backdrop-blur-[2px] transition-opacity duration-200 animate-in fade-in duration-150"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="pointer-events-auto absolute inset-x-0 bottom-0 z-[46] animate-in fade-in slide-in-from-bottom duration-150"
            data-no-swipe=""
          >
            <div className="mx-auto mb-[max(0.25rem,env(safe-area-inset-bottom,0px))] max-h-[min(50dvh,22rem)] w-full max-w-md overflow-hidden rounded-t-3xl border border-border/90 bg-popover pb-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <p className="text-sm font-semibold">Votes & Members</p>
                <button
                  type="button"
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
                  onClick={() => setMoreOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col gap-2 p-4 pt-2">
                {secondary.map((item) =>
                  renderNavButton(item, {
                    compact: true,
                  }),
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
