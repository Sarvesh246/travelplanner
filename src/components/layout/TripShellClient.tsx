"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import { ROUTES } from "@/lib/constants";

interface TripShellClientProps {
  tripId: string;
  children: React.ReactNode;
}

const SWIPE_SECTIONS = [
  "overview",
  "itinerary",
  "supplies",
  "expenses",
  "votes",
  "members",
] as const;

function getSectionHref(tripId: string, section: (typeof SWIPE_SECTIONS)[number]) {
  switch (section) {
    case "overview":
      return ROUTES.tripOverview(tripId);
    case "itinerary":
      return ROUTES.tripItinerary(tripId);
    case "supplies":
      return ROUTES.tripSupplies(tripId);
    case "expenses":
      return ROUTES.tripExpenses(tripId);
    case "votes":
      return ROUTES.tripVotes(tripId);
    case "members":
      return ROUTES.tripMembers(tripId);
  }
}

function getCurrentSection(pathname: string, tripId: string) {
  const match = pathname.match(/^\/trips\/([^/]+)(?:\/([^/]+))?/);
  if (!match || match[1] !== tripId) return null;

  const section = match[2];
  if (!section || section === "overview") return "overview";
  if (section === "stops") return null;
  return SWIPE_SECTIONS.includes(section as (typeof SWIPE_SECTIONS)[number])
    ? (section as (typeof SWIPE_SECTIONS)[number])
    : null;
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    && Boolean(
      target.closest(
        'input, textarea, select, button, a, [role="button"], [role="dialog"], [data-no-swipe]'
      )
    );
}

export function TripShellClient({ tripId, children }: TripShellClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const touchRef = useRef<{
    x: number;
    y: number;
    interactive: boolean;
  } | null>(null);

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (window.innerWidth >= 768) {
      touchRef.current = null;
      return;
    }

    const touch = e.touches[0];
    touchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      interactive: isInteractiveTarget(e.target),
    };
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    const state = touchRef.current;
    touchRef.current = null;
    if (!state || state.interactive) return;

    const current = getCurrentSection(pathname, tripId);
    if (!current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - state.x;
    const deltaY = touch.clientY - state.y;
    if (Math.abs(deltaX) < 72 || Math.abs(deltaY) > 64) return;

    const index = SWIPE_SECTIONS.indexOf(current);
    const nextIndex = deltaX < 0 ? index + 1 : index - 1;
    const nextSection = SWIPE_SECTIONS[nextIndex];
    if (!nextSection) return;

    router.push(getSectionHref(tripId, nextSection));
  }

  return (
    <div
      className="min-h-0 flex-1"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}
