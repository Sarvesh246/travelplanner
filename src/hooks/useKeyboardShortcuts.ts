"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/components/layout/AppThemeProvider";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useLoadingStore } from "@/lib/store/loading";
import { ROUTES } from "@/lib/constants";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  if (target.closest('[role="textbox"]')) return true;
  return false;
}

/**
 * Global keyboard shortcuts:
 *
 * - Cmd/Ctrl+K .................. toggle command palette (works even in inputs)
 * - Esc ......................... close palette (works even in the search input)
 * - / or ? ...................... open palette
 * - N ........................... new trip
 * - T ........................... toggle theme
 * - G then D / H ................ dashboard
 * - G then N .................... new trip
 * - G then O/I/S/E/V/M .......... trip overview/itinerary/supplies/expenses/votes/members
 *                                 (trip-scoped keys only work inside /trips/:id)
 *
 * Shortcuts requiring sequences time out after ~900 ms.
 * All non-modifier shortcuts are ignored while typing in an input/textarea or
 * while the palette is open so the user can type freely.
 */
export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    let pending: string | null = null;
    let timer: number | null = null;

    const clearPending = () => {
      pending = null;
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    const tripIdFromPath = () => {
      const m = pathname.match(/^\/trips\/([^/]+)/);
      return m?.[1] ?? null;
    };

    const paletteOpen = () => useCommandPalette.getState().open;
    const setPaletteOpen = (next: boolean) =>
      useCommandPalette.getState().setOpen(next);
    const togglePalette = () => useCommandPalette.getState().toggle();

    const navigateTo = (href: string) => {
      if (typeof window !== "undefined" && window.location.pathname === href) return;
      useLoadingStore.getState().startNavigation();
      router.push(href);
    };

    const handle = (e: KeyboardEvent) => {
      if (e.isComposing) return;

      // Always-on: palette toggle (Cmd/Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
        clearPending();
        return;
      }

      // Always-on: escape closes palette
      if (e.key === "Escape") {
        if (paletteOpen()) {
          e.preventDefault();
          setPaletteOpen(false);
        }
        clearPending();
        return;
      }

      // Ignore the rest while typing or while palette is open
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      if (paletteOpen()) return;

      const key = e.key.toLowerCase();
      const tripId = tripIdFromPath();

      // "G then X" sequences
      if (pending === "g") {
        let route: string | null = null;
        switch (key) {
          case "d":
          case "h":
            route = ROUTES.dashboard;
            break;
          case "n":
            route = ROUTES.newTrip;
            break;
          case "o":
            if (tripId) route = ROUTES.tripOverview(tripId);
            break;
          case "i":
            if (tripId) route = ROUTES.tripItinerary(tripId);
            break;
          case "s":
            if (tripId) route = ROUTES.tripSupplies(tripId);
            break;
          case "e":
            if (tripId) route = ROUTES.tripExpenses(tripId);
            break;
          case "v":
            if (tripId) route = ROUTES.tripVotes(tripId);
            break;
          case "m":
            if (tripId) route = ROUTES.tripMembers(tripId);
            break;
        }
        if (route) {
          e.preventDefault();
          navigateTo(route);
        }
        clearPending();
        return;
      }

      if (key === "g") {
        pending = "g";
        if (timer !== null) window.clearTimeout(timer);
        timer = window.setTimeout(clearPending, 900);
        return;
      }

      switch (key) {
        case "n":
          e.preventDefault();
          navigateTo(ROUTES.newTrip);
          break;
        case "t":
          e.preventDefault();
          setTheme(theme === "dark" ? "light" : "dark");
          break;
        case "/":
        case "?":
          e.preventDefault();
          setPaletteOpen(true);
          break;
      }
    };

    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      clearPending();
    };
  }, [router, pathname, theme, setTheme]);
}
