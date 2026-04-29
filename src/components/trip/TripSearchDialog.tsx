"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { expenseAnchorForId, supplyAnchorForId } from "@/lib/deep-link-hash";

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
    void load();
    setQuery("");
  }, [open, load]);

  const q = norm(query);

  const filtered = useMemo(() => {
    if (!index) return [];
    type Hit =
      | { href: string; title: string; subtitle: string; group: string };
    const out: Hit[] = [];
    for (const s of index.stops) {
      if (!q || norm(s.name).includes(q)) {
        out.push({
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
    <div className="fixed inset-0 z-[130] flex items-end justify-center p-0 sm:items-start sm:p-6 sm:pt-[12vh]" data-no-swipe="">
      <button type="button" className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => onOpenChange(false)} aria-label="Close search" />
      <div className="relative z-[131] mb-16 flex h-[min(78dvh,28rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-popover shadow-2xl sm:mb-0 sm:h-auto sm:min-h-[min(60dvh,22rem)] sm:rounded-2xl md:rounded-2xl">
        <Command className="flex min-h-0 flex-1 flex-col" loop shouldFilter={false}>
          <div className="flex items-center gap-3 border-b border-border px-3 py-2.5 sm:py-3">
            {loading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            ) : (
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search stops, expenses, supplies, polls, members…"
              autoFocus
              className="min-w-0 flex-1 bg-transparent py-1 text-[15px] outline-none placeholder:text-muted-foreground"
            />
          </div>
          {error && <p className="px-3 py-2 text-xs text-destructive">{error}</p>}
          <Command.List className="max-h-[min(62dvh,18rem)] flex-1 overflow-y-auto px-2 py-2 sm:max-h-[min(50vh,20rem)]">
            {!loading && !error && filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing matches.</p>
            )}
            {filtered.map((hit) => (
              <Command.Item
                key={`${hit.group}-${hit.title}-${hit.href}`}
                value={`${hit.title} ${hit.subtitle}`}
                onSelect={() => {
                  onOpenChange(false);
                  router.push(hit.href);
                }}
                className="flex cursor-pointer flex-col rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/80 dark:hover:bg-accent/40"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {hit.group}
                </span>
                <span className="text-sm font-medium text-foreground">{hit.title}</span>
                <span className="text-xs text-muted-foreground">{hit.subtitle}</span>
              </Command.Item>
            ))}
          </Command.List>
          <div className="border-t border-border px-3 py-2">
            <p className="text-[11px] text-muted-foreground">
              Narrow results with the keyboard. Sequence <kbd className="rounded px-1 font-mono text-[10px]">g</kbd> then{" "}
              <kbd className="rounded px-1 font-mono text-[10px]">a</kbd> jumps to Activity.
            </p>
          </div>
        </Command>
      </div>
    </div>
  );
}
