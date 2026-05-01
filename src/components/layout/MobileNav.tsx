"use client";

import { useEffect, useState } from "react";
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
  ChevronRight,
  History,
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
    { href: ROUTES.tripActivity(tripId), label: "Activity", mobileLabel: "Log", icon: History },
  ];

export function MobileNav({ tripId }: MobileNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = PRIMARY(tripId);
  const secondary = MORE_ITEMS(tripId);

  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

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

  function renderNavButton(item: TripNavTab) {
    const isActive = isHrefActive(item);
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
          "app-tap relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium leading-none transition-colors duration-200 min-[390px]:text-[10.5px]",
          isActive
            ? "bg-primary/16 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        {isActive ? (
          <span
            className="absolute top-0.5 h-1 w-1 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)]"
            aria-hidden
          />
        ) : null}
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 min-[390px]:h-[2.375rem] min-[390px]:w-[2.375rem]",
            isActive ? "bg-primary/14" : "bg-transparent",
          )}
        >
          <Icon
            className="h-[1.26rem] w-[1.26rem] min-[390px]:h-[1.34rem] min-[390px]:w-[1.34rem] text-current opacity-95"
            strokeWidth={isActive ? 2.125 : 1.875}
          />
        </span>
        <span className="min-w-0 truncate">{item.mobileLabel ?? item.label}</span>
      </Link>
    );
  }

  return (
    <>
      <nav
        className="app-mobile-nav fixed bottom-0 left-0 right-0 z-40 isolate overflow-hidden border-t border-border/90 bg-card/96 shadow-[0_-18px_48px_-30px_hsl(var(--primary)/0.72),0_-10px_30px_-22px_hsl(var(--foreground)/0.38)] backdrop-blur-3xl backdrop-saturate-150 md:hidden"
        aria-label="Trip sections"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--card)/0.94),hsl(var(--card)/0.98))]"
        />
        <div className="relative z-10 mx-auto grid max-w-5xl grid-cols-5 gap-1 px-[max(0.3rem,env(safe-area-inset-left,0px))] pb-[max(0.18rem,env(safe-area-inset-bottom,0px))] pr-[max(0.3rem,env(safe-area-inset-right,0px))] pt-1">
          {primary.map((item) => renderNavButton(item))}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
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
        <div
          className="fixed inset-0 z-[55] md:hidden"
          role="presentation"
          data-no-swipe=""
        >
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in duration-150"
            onClick={() => setMoreOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-sheet-title"
            className="pointer-events-auto absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[1.75rem] border border-border/90 border-b-0 bg-card shadow-[0_-24px_48px_-32px_rgba(0,0,0,0.45),0_-8px_40px_-18px_hsl(var(--primary)/0.35)] animate-in fade-in slide-in-from-bottom duration-200 ease-out"
          >
            <div className="flex justify-center pt-3 pb-2" aria-hidden>
              <span className="h-1 w-11 rounded-full bg-muted-foreground/28" />
            </div>

            <div className="border-b border-border/70 px-5 pb-4 pt-1">
              <p
                id="mobile-more-sheet-title"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Collaboration
              </p>
              <p className="mt-1 text-base font-semibold tracking-tight text-foreground">
                Polls & people
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Votes, members, and recent activity—the same shortcuts as on desktop.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 px-3 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-3">
              {secondary.map((item) => {
                const isActive = isHrefActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    onClick={() => setMoreOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "app-tap flex min-h-[3.25rem] items-center gap-3 rounded-2xl px-4 py-3 transition-[background-color,border-color,box-shadow,color] duration-200",
                      isActive
                        ? "border border-primary/28 bg-primary/12 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.15)]"
                        : "border border-transparent bg-muted/35 hover:border-border/80 hover:bg-muted/55 active:bg-muted/70",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-[inset_0_0_0_1px_hsl(var(--border)/0.55)] transition-colors duration-200",
                        isActive ? "bg-primary/18 text-primary" : "bg-background/90 text-muted-foreground",
                      )}
                    >
                      <Icon className="h-[1.35rem] w-[1.35rem]" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-tight">{item.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.label === "Votes"
                          ? "Decide as a group"
                          : item.label === "Activity"
                            ? "What changed lately"
                            : "Invitees and roles"}
                      </span>
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
                        isActive && "text-primary opacity-90",
                      )}
                      aria-hidden
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
