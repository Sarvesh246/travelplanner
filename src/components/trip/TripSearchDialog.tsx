"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, Loader2, X } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { expenseAnchorForId, supplyAnchorForId } from "@/lib/deep-link-hash";
import { cn } from "@/lib/utils";

type Index = {
  stops: { id: string; name: string }[];
  expenses: { id: string; title: string; category: string | null }[];
  supplies: { id: string; name: string; status: string }[];
  votes: { id: string; title: string; status: string }[];
  members: { userId: string; role: string; name: string; email: string }[];
};

interface TripSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

export function TripSearchDialog({ open, onOpenChange, tripId }: TripSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState<Index | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/search`, { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) throw new Error("Could not load search index");
      setIndex(await res.json());
    } catch {
      setError("Search is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    setQuery("");
  }, [open, load]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const q = norm(query);

  const filtered = useMemo(() => {
    if (!index) return [];
    type Hit = {
      /** Stable React key suffix (avoids collisions on members → same route). */
      rk: string;
      href: string;
      title: string;
      subtitle: string;
      group: string;
    };
    const out: Hit[] = [];
    for (const s of index.stops) {
      if (!q || norm(s.name).includes(q)) {
        out.push({
          rk: `stop-${s.id}`,
          href: ROUTES.tripStop(tripId, s.id),
          title: s.name,
          subtitle: "Stop",
          group: "Stops",
        });
      }
    }
    for (const e of index.expenses) {
      const blob = `${e.title} ${e.category ?? ""}`;
      if (!q || norm(blob).includes(q)) {
        out.push({
          rk: `expense-${e.id}`,
          href: `${ROUTES.tripExpenses(tripId)}#${expenseAnchorForId(e.id)}`,
          title: e.title,
          subtitle: [e.category, "Expense"].filter(Boolean).join(" · "),
          group: "Expenses",
        });
      }
    }
    for (const s of index.supplies) {
      const blob = `${s.name} ${s.status}`;
      if (!q || norm(blob).includes(q)) {
        out.push({
          rk: `supply-${s.id}`,
          href: `${ROUTES.tripSupplies(tripId)}#${supplyAnchorForId(s.id)}`,
          title: s.name,
          subtitle: `Supply · ${s.status.replace(/_/g, " ")}`,
          group: "Supplies",
        });
      }
    }
    for (const v of index.votes) {
      const blob = `${v.title} ${v.status}`;
      if (!q || norm(blob).includes(q)) {
        out.push({
          rk: `vote-${v.id}`,
          href: ROUTES.tripVotes(tripId),
          title: v.title,
          subtitle: `Poll · ${v.status}`,
          group: "Votes",
        });
      }
    }
    for (const m of index.members) {
      const blob = `${m.name} ${m.email} ${m.role}`;
      if (!q || norm(blob).includes(q)) {
        out.push({
          rk: `member-${m.userId}`,
          href: ROUTES.tripMembers(tripId),
          title: m.name || m.email,
          subtitle: `Member · ${m.role}`,
          group: "Members",
        });
      }
    }
    return out;
  }, [index, q, tripId]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[130] flex justify-center",
        "max-md:items-end md:items-start md:p-6 md:pt-[10vh]",
      )}
      data-no-swipe=""
    >
      {/* Scrim */}
      <button
        type="button"
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px] transition-opacity animate-in fade-in duration-150"
        onClick={() => onOpenChange(false)}
        aria-label="Dismiss search overlay"
      />

      {/* Sheet: full-width anchored bottom on small screens */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-search-heading"
        className={cn(
          "pointer-events-auto relative z-[131] isolate flex max-h-[min(88dvh,720px)] w-full touch-manipulation flex-col overflow-hidden rounded-t-[1.35rem]",
          "border border-border bg-card shadow-[0_-14px_50px_-20px_rgba(0,0,0,0.55)]",
          "motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:fade-in duration-200",
          "md:h-auto md:max-h-[min(72vh,32rem)] md:max-w-lg md:rounded-2xl md:border md:shadow-xl motion-safe:md:slide-in-from-bottom-0 motion-safe:md:zoom-in-95",
          "motion-reduce:motion-safe:animate-none motion-reduce:opacity-100",
        )}
      >
        <Command
          loop
          shouldFilter={false}
          className={cn(
            "flex min-h-0 flex-1 flex-col bg-transparent",
            /* cmdk renders an internal group; constrain width so accents never leak as side blocks */
            "[&_[cmdk-item]]:!w-full [&_[cmdk-item]]:!justify-start [&_[cmdk-item]]:!overflow-hidden",
            "[&_[cmdk-item][data-selected=true]]:!bg-muted/65 [&_[cmdk-item][data-selected=true]]:!text-foreground",
            "[&_[cmdk-group-heading]]:!px-4 [&_[cmdk-group-heading]]:!py-1.5 [&_[cmdk-group-heading]]:!text-[10px]",
          )}
        >
          <div className="shrink-0 border-b border-border/80 px-4 pb-4 pt-[max(0.5rem,env(safe-area-inset-top))] md:border-border">
            <div className="mx-auto mb-4 h-1 w-11 shrink-0 rounded-full bg-muted/90 md:hidden" aria-hidden />

            <div className="mb-4 flex min-h-[44px] items-center gap-3">
              <h2 id="trip-search-heading" className="min-w-0 flex-1 text-lg font-semibold tracking-tight text-foreground">
                Search trip
              </h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex shrink-0 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border/80 bg-muted/35 text-muted-foreground transition-[background-color,color,transform] duration-200 hover:bg-muted/65 hover:text-foreground active:scale-[0.98] md:hidden"
                aria-label="Close search"
              >
                <X className="h-5 w-5 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className={cn(
                  "hidden shrink-0 min-h-[40px] min-w-[52px] items-center justify-center rounded-lg border border-border/65 bg-muted/25 px-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground md:inline-flex",
                )}
                aria-label="Close search"
              >
                <span className="font-mono text-[11px] font-medium leading-none opacity-95">Esc</span>
              </button>
            </div>

            <label
              htmlFor="trip-search-input"
              className="flex min-h-[52px] w-full cursor-text items-center gap-3 rounded-2xl border border-border/90 bg-muted/25 px-3.5 py-3 outline-none ring-offset-background transition-[box-shadow,border-color] duration-300 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/60 dark:bg-muted/15"
            >
              <span className="sr-only">Filter trip results</span>
              {loading ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
              ) : (
                <Search className="h-5 w-5 shrink-0 text-muted-foreground opacity-85" aria-hidden />
              )}
              <Command.Input
                id="trip-search-input"
                value={query}
                onValueChange={setQuery}
                placeholder="Search this trip…"
                autoCapitalize="none"
                enterKeyHint="search"
                inputMode="search"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent py-1 text-[16px] leading-snug outline-none placeholder:text-muted-foreground/82 md:text-[15px]"
              />
            </label>
          </div>

          {error && <p className="border-b border-border px-5 py-2.5 text-sm text-destructive">{error}</p>}

          <Command.List
            className={cn(
              "flex-1 overflow-y-auto overscroll-contain px-2 py-3 [scrollbar-width:thin]",
              "min-h-0 max-md:max-h-[min(52dvh,28rem)] md:max-h-[min(48vh,21rem)]",
            )}
          >
            {!loading && !error && filtered.length === 0 && (
              <p className="px-4 py-10 text-center text-sm leading-relaxed text-muted-foreground">
                Nothing matches. Try fewer letters or browse from the sidebar.
              </p>
            )}
            {filtered.map((hit) => (
              <Command.Item
                key={hit.rk}
                value={`${hit.group} ${hit.title} ${hit.subtitle}`}
                onSelect={() => {
                  onOpenChange(false);
                  router.push(hit.href);
                }}
                className={cn(
                  "mb-2 flex min-h-[3.75rem] w-full max-w-full cursor-pointer touch-manipulation flex-col rounded-2xl border border-transparent px-4 py-[0.9375rem]",
                  "text-left outline-none ring-offset-background",
                  "transition-[background-color,box-shadow,transform] duration-300 hover:bg-muted/55",
                  "data-[selected=true]:shadow-[inset_0_0_0_1px_hsl(var(--border)/0.65)] motion-safe:active:scale-[0.99]",
                )}
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {hit.group}
                </span>
                <span className="mt-1 text-[15px] font-semibold leading-tight tracking-tight text-foreground">{hit.title}</span>
                <span className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{hit.subtitle}</span>
              </Command.Item>
            ))}
          </Command.List>

          <footer className="shrink-0 border-t border-border/80 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <p className="text-[12px] leading-relaxed text-muted-foreground md:hidden">
              Tap the dimmed backdrop or use <span className="font-medium text-foreground/85">Close</span> above. Selecting a row opens that part of this trip.
            </p>
            <p className="hidden text-[11px] leading-snug text-muted-foreground md:block">
              Shortcuts:&nbsp;<kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">g</kbd>{" "}
              then&nbsp;
              <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">a</kbd> Activity ·{" "}
              <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> closes.
            </p>
          </footer>
        </Command>
      </div>
    </div>
  );
}
