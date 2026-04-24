"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Command } from "cmdk";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Map,
  Package,
  Receipt,
  Vote,
  Users,
  Plus,
  Moon,
  Sun,
  Search,
  Plane,
} from "lucide-react";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { ROUTES } from "@/lib/constants";

export function CommandPalette() {
  const { open, setOpen, toggle } = useCommandPalette();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Cmd/Ctrl+K opens the palette
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [toggle]);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  // Extract tripId from path if we're inside a trip workspace
  const tripMatch = pathname.match(/^\/trips\/([^/]+)/);
  const tripId = tripMatch?.[1];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <Command
        label="Command menu"
        className="relative w-full max-w-lg bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden"
        loop
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Command.Input
            autoFocus
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[360px] overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          <Command.Group heading="Navigation">
            <CommandItem
              icon={<LayoutDashboard className="w-4 h-4" />}
              label="Dashboard"
              onSelect={() => run(() => router.push(ROUTES.dashboard))}
              shortcut="G D"
            />
            {tripId && (
              <>
                <CommandItem
                  icon={<Plane className="w-4 h-4" />}
                  label="Trip overview"
                  onSelect={() => run(() => router.push(ROUTES.tripOverview(tripId)))}
                  shortcut="G O"
                />
                <CommandItem
                  icon={<Map className="w-4 h-4" />}
                  label="Itinerary"
                  onSelect={() => run(() => router.push(ROUTES.tripItinerary(tripId)))}
                  shortcut="G I"
                />
                <CommandItem
                  icon={<Package className="w-4 h-4" />}
                  label="Supplies"
                  onSelect={() => run(() => router.push(ROUTES.tripSupplies(tripId)))}
                  shortcut="G S"
                />
                <CommandItem
                  icon={<Receipt className="w-4 h-4" />}
                  label="Expenses"
                  onSelect={() => run(() => router.push(ROUTES.tripExpenses(tripId)))}
                  shortcut="G E"
                />
                <CommandItem
                  icon={<Vote className="w-4 h-4" />}
                  label="Votes"
                  onSelect={() => run(() => router.push(ROUTES.tripVotes(tripId)))}
                  shortcut="G V"
                />
                <CommandItem
                  icon={<Users className="w-4 h-4" />}
                  label="Members"
                  onSelect={() => run(() => router.push(ROUTES.tripMembers(tripId)))}
                  shortcut="G M"
                />
              </>
            )}
          </Command.Group>

          <Command.Group heading="Actions">
            <CommandItem
              icon={<Plus className="w-4 h-4" />}
              label="Create new trip"
              onSelect={() => run(() => router.push(ROUTES.newTrip))}
              shortcut="N"
            />
          </Command.Group>

          <Command.Group heading="Appearance">
            <CommandItem
              icon={theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onSelect={() =>
                run(() => setTheme(theme === "dark" ? "light" : "dark"))
              }
            />
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

function CommandItem({
  icon,
  label,
  onSelect,
  shortcut,
}: {
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
  shortcut?: string;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-muted transition-colors"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && (
        <kbd className="text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}
