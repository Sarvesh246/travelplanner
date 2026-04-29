"use client";

import { usePathname, useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { TripSearchDialog } from "@/components/trip/TripSearchDialog";
import { useTripSearch } from "@/hooks/useTripSearch";
import {
  getTripMembershipChannelName,
  type TripMembershipRealtimeEvent,
} from "@/lib/supabase/trip-membership-shared";

interface TripShellClientProps {
  tripId: string;
  userId: string;
  children: React.ReactNode;
}

const SWIPE_SECTIONS = [
  "overview",
  "itinerary",
  "supplies",
  "expenses",
  "votes",
  "members",
  "activity",
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
    case "activity":
      return ROUTES.tripActivity(tripId);
  }
}

function getCurrentSection(pathname: string, tripId: string) {
  const match = pathname.match(/^\/trips\/([^/]+)(?:\/([^/]+))?/);
  if (!match || match[1] !== tripId) return null;

  const section = match[2];
  if (!section || section === "overview") return "overview";
  if (section === "stops") return null;
  if (section === "activity") return "activity";
  return SWIPE_SECTIONS.includes(section as (typeof SWIPE_SECTIONS)[number])
    ? (section as (typeof SWIPE_SECTIONS)[number])
    : null;
}

/** Bounded ancestor walk avoids `closest()` selector work on touchends over large subtrees during INP-critical paths. */
function isInteractiveTarget(target: EventTarget | null): boolean {
  let el = target instanceof HTMLElement ? target : null;
  for (let i = 0; i < 12 && el; i++) {
    if (el.hasAttribute("data-no-swipe")) return true;
    const tag = el.tagName;
    if (
      tag === "INPUT"
      || tag === "TEXTAREA"
      || tag === "SELECT"
      || tag === "BUTTON"
      || tag === "A"
    ) {
      return true;
    }
    const role = el.getAttribute("role");
    if (role === "button" || role === "dialog") return true;
    el = el.parentElement;
  }
  return false;
}

export function TripShellClient({ tripId, userId, children }: TripShellClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchOpen = useTripSearch((s) => s.open);
  const setSearchOpen = useTripSearch((s) => s.setOpen);
  const [accessRevoked, setAccessRevoked] = useState(false);
  const redirectingRef = useRef(false);
  const touchRef = useRef<{
    x: number;
    y: number;
    interactive: boolean;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let inFlight: AbortController | null = null;

    async function checkAccess() {
      if (redirectingRef.current || document.visibilityState === "hidden") return;
      inFlight?.abort();
      const controller = new AbortController();
      inFlight = controller;

      try {
        const response = await fetch(`/api/trips/${tripId}/access`, {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (response.ok) return;

        if (response.status === 401 || response.status === 403 || response.status === 404) {
          redirectingRef.current = true;
          setAccessRevoked(true);
          toast.warning(
            response.status === 401
              ? "Your session ended. Sign in again to keep planning."
              : "Your access to this trip was removed."
          );
          router.replace(
            response.status === 401 ? ROUTES.login : `${ROUTES.dashboard}?access=revoked`
          );
          router.refresh();
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    async function handleMembershipEvent(payload: TripMembershipRealtimeEvent) {
      if (payload.tripId !== tripId || payload.targetUserId !== userId || redirectingRef.current) {
        return;
      }

      if (payload.type === "membership-updated") {
        toast.message("Your trip access changed.", {
          description: "Refreshing this page to pick up the latest permissions.",
        });
        router.refresh();
        return;
      }

      redirectingRef.current = true;
      setAccessRevoked(true);
      toast.warning("Your access to this trip was removed.");
      router.replace(`${ROUTES.dashboard}?access=revoked`);
      router.refresh();
    }

    void checkAccess();
    const channel = supabase
      .channel(getTripMembershipChannelName(tripId, userId))
      .on("broadcast", { event: "trip-membership" }, ({ payload }) => {
        void handleMembershipEvent(payload as TripMembershipRealtimeEvent);
      })
      .subscribe();

    function handleVisibilityOrFocus() {
      void checkAccess();
    }

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      inFlight?.abort();
      void supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [router, tripId, userId]);

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

    const href = getSectionHref(tripId, nextSection);
    /** Defer client navigation past the gesture so the interaction can yield before Router + RSC work (INP). */
    window.requestAnimationFrame(() => {
      startTransition(() => {
        router.push(href);
      });
    });
  }

  return (
    <div
      className="min-h-0 flex-1"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {accessRevoked ? (
        <div className="flex min-h-[55dvh] items-center justify-center px-4 text-center">
          <div className="app-surface max-w-md rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Trip access changed</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your access to this trip was removed. We are taking you back to your trip hub.
            </p>
          </div>
        </div>
      ) : (
        <>
          {children}
          <TripSearchDialog open={searchOpen} onOpenChange={setSearchOpen} tripId={tripId} />
        </>
      )}
    </div>
  );
}
