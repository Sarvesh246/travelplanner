"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Command } from "cmdk";
import { useTheme } from "@/components/layout/AppThemeProvider";
import {
  LayoutDashboard,
  Map,
  Package,
  Receipt,
  Vote,
  Users,
  History,
  Plus,
  Moon,
  Sun,
  Search,
  Plane,
} from "lucide-react";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useTripSearch } from "@/hooks/useTripSearch";
import { useIsMac } from "@/hooks/useIsMac";
import { useLoadingStore } from "@/lib/store/loading";
import { ROUTES } from "@/lib/constants";
import { Kbd } from "@/components/shared/Kbd";

/**
 * Renders only when the palette is open. Mount/unmount on open transition
 * naturally resets the local search state and lets us keep the input fully
 * controlled without a side-effect to clear it.
 */
export function CommandPalette() {
  const open = useCommandPalette((s) => s.open);
  if (!open) return null;
  return <CommandPaletteInner />;
}

function CommandPaletteInner() {
  const setOpen = useCommandPalette((s) => s.setOpen);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState("");
  const isMac = useIsMac();

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  /** Navigate via router.push and arm the global navigation loader. */
  function go(href: string) {
    setOpen(false);
    if (typeof window !== "undefined" && window.location.pathname === href) return;
    useLoadingStore.getState().startNavigation();
    router.push(href);
  }

  const tripMatch = pathname.match(/^\/trips\/([^/]+)/);
  const tripId = tripMatch?.[1];
  const canTripSearch = Boolean(tripId && tripId !== "new");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-2 pt-[max(0.5rem,calc(env(safe-area-inset-top,0px)+0.35rem))] min-[500px]:p-4 min-[500px]:pt-[max(1rem,12vh)]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      {/* Backdrop — full blur applied instantly so the page snaps behind */}
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-md"
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <Command
        label="Command menu"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl animate-in fade-in zoom-in-95 duration-150 ease-out"
        loop
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Command.Input
            autoFocus
            value={search}
            onValueChange={setSearch}
            placeholder="Search commands or type to jump…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <span className="hidden min-[500px]:inline-flex">
            <Kbd keys="Esc" />
          </span>
        </div>

        <Command.List className="max-h-[min(52dvh,380px)] overflow-x-hidden overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          <Command.Group heading="Navigation">
            {canTripSearch && tripId && (
              <CommandItem
                icon={<Search className="w-4 h-4" />}
                label="Search this trip"
                onSelect={() => {
                  setOpen(false);
                  useTripSearch.getState().setOpen(true);
                }}
              />
            )}
            <CommandItem
              icon={<LayoutDashboard className="w-4 h-4" />}
              label="Dashboard"
              onSelect={() => go(ROUTES.dashboard)}
              shortcut="G D"
              chord
            />
            {tripId && (
              <>
                <CommandItem
                  icon={<Plane className="w-4 h-4" />}
                  label="Trip overview"
                  onSelect={() => go(ROUTES.tripOverview(tripId))}
                  shortcut="G O"
                  chord
                />
                <CommandItem
                  icon={<Map className="w-4 h-4" />}
                  label="Itinerary"
                  onSelect={() => go(ROUTES.tripItinerary(tripId))}
                  shortcut="G I"
                  chord
                />
                <CommandItem
                  icon={<Package className="w-4 h-4" />}
                  label="Supplies"
                  onSelect={() => go(ROUTES.tripSupplies(tripId))}
                  shortcut="G S"
                  chord
                />
                <CommandItem
                  icon={<Receipt className="w-4 h-4" />}
                  label="Expenses"
                  onSelect={() => go(ROUTES.tripExpenses(tripId))}
                  shortcut="G E"
                  chord
                />
                <CommandItem
                  icon={<Vote className="w-4 h-4" />}
                  label="Votes"
                  onSelect={() => go(ROUTES.tripVotes(tripId))}
                  shortcut="G V"
                  chord
                />
                <CommandItem
                  icon={<Users className="w-4 h-4" />}
                  label="Members"
                  onSelect={() => go(ROUTES.tripMembers(tripId))}
                  shortcut="G M"
                  chord
                />
                <CommandItem
                  icon={<History className="w-4 h-4" />}
                  label="Activity"
                  onSelect={() => go(ROUTES.tripActivity(tripId))}
                  shortcut="G A"
                  chord
                />
              </>
            )}
          </Command.Group>

          <Command.Group heading="Actions">
            <CommandItem
              icon={<Plus className="w-4 h-4" />}
              label="Create new trip"
              onSelect={() => go(ROUTES.newTrip)}
              shortcut="N"
            />
          </Command.Group>

          <Command.Group heading="Appearance">
            <CommandItem
              icon={
                theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )
              }
              label={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
              onSelect={() =>
                run(() => setTheme(theme === "dark" ? "light" : "dark"))
              }
              shortcut="T"
            />
          </Command.Group>
        </Command.List>

        <div className="hidden min-[500px]:flex min-[500px]:flex-col min-[500px]:gap-2 min-[500px]:border-t min-[500px]:border-border min-[500px]:bg-muted/40 min-[500px]:px-4 min-[500px]:py-2.5 min-[500px]:text-[11px] min-[500px]:text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 min-[500px]:gap-3">
              <span className="flex items-center gap-1.5">
                <Kbd keys="↑" />
                <Kbd keys="↓" />
                <span>navigate</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd keys="↵" />
                <span>select</span>
              </span>
            </div>
            <span className="flex items-center gap-1.5">
              <Kbd keys={isMac ? "⌘ K" : "Ctrl K"} />
              <span>toggle</span>
            </span>
          </div>
        </div>
      </Command>
    </div>
  );
}

function CommandItem({
  icon,
  label,
  onSelect,
  shortcut,
  chord = false,
}: {
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
  shortcut?: string;
  chord?: boolean;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-muted aria-selected:text-foreground text-foreground transition-colors"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">{label}</span>
      {shortcut && (
        <span className="hidden min-[500px]:inline-flex">
          <Kbd keys={shortcut} asChord={chord} />
        </span>
      )}
    </Command.Item>
  );
}
