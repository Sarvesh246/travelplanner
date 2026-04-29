"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { StickyActionBar } from "@/components/layout/StickyActionBar";
import { Plus } from "lucide-react";
import { ExpenseList } from "./ExpenseList";
import { BalanceSummary } from "./BalanceSummary";
import { ExpenseCategoryChart } from "./ExpenseCategoryChart";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { ExpenseDetailPanel } from "./ExpenseDetailPanel";
import { useTripContext } from "@/components/trip/TripContext";
import { parseExpenseHash, expenseAnchorForId } from "@/lib/deep-link-hash";
import type { MemberBalance, Settlement } from "@/lib/balance-calculator";
import type { ExpenseSerialized } from "./types";
import { readTripUiPrefs, writeTripUiPrefs } from "@/lib/trip-ui-preferences";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface ExpensesClientProps {
  tripId: string;
  currency: string;
  expenses: ExpenseSerialized[];
  balances: MemberBalance[];
  settlements: Settlement[];
}

export function ExpensesClient({
  tripId,
  currency,
  expenses,
  balances,
  settlements,
}: ExpensesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { canEdit, currentUser, members } = useTripContext();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  const [sort, setSort] = useState<"date" | "amount" | "payer" | "category">(() => readTripUiPrefs(tripId).expenseSort ?? "date");
  const [mine, setMine] = useState(() => readTripUiPrefs(tripId).expenseMine ?? false);
  const [category, setCategory] = useState<string>("");
  const [payerFilter, setPayerFilter] = useState<string>("");

  useEffect(() => {
    writeTripUiPrefs(tripId, { expenseSort: sort });
  }, [tripId, sort]);

  useEffect(() => {
    writeTripUiPrefs(tripId, { expenseMine: mine });
  }, [tripId, mine]);

  const filteredSorted = useMemo(() => {
    let list = expenses;
    if (mine) {
      list = list.filter(
        (e) =>
          e.paidById === currentUser.id ||
          e.shares.some((s) => s.userId === currentUser.id)
      );
    }
    if (category) {
      list = list.filter((e) => (e.category ?? "").trim() === category);
    }
    if (payerFilter) {
      list = list.filter((e) => e.paidById === payerFilter);
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "amount":
          return b.totalAmount - a.totalAmount;
        case "payer":
          return a.paidBy.name.localeCompare(b.paidBy.name);
        case "category":
          return (a.category ?? "").localeCompare(b.category ?? "");
        case "date":
        default:
          return new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime();
      }
    });
    return sorted;
  }, [category, expenses, mine, payerFilter, sort, currentUser.id]);

  const filteredTotal = useMemo(() => filteredSorted.reduce((sum, e) => sum + e.totalAmount, 0), [filteredSorted]);
  const myNet = useMemo(() => balances.find((b) => b.userId === currentUser.id)?.net ?? 0, [balances, currentUser.id]);

  function scrollExpenseRowIntoView(id: string) {
    requestAnimationFrame(() => {
      const prefers =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(`expense-row-${id}`)?.scrollIntoView({
        behavior: prefers ? "instant" : "smooth",
        block: "nearest",
      });
    });
  }

  function revealExpense(id: string, opts?: { syncUrl?: boolean }) {
    setSelectedExpenseId(id);
    if (opts?.syncUrl) {
      const next = `${pathname}#${expenseAnchorForId(id)}`;
      if (typeof window !== "undefined" && `${window.location.pathname}${window.location.hash}` !== next) {
        router.replace(next, { scroll: false });
      }
    }
    scrollExpenseRowIntoView(id);
  }

  useEffect(() => {
    function sync() {
      if (typeof window === "undefined") return;
      const id = parseExpenseHash(window.location.hash);
      if (!id) return;
      if (!expenses.some((e) => e.id === id)) return;
      setSelectedExpenseId(id);
      scrollExpenseRowIntoView(id);
    }

    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [expenses]);

  const effectiveSelectedExpenseId =
    selectedExpenseId && filteredSorted.some((e) => e.id === selectedExpenseId)
      ? selectedExpenseId
      : filteredSorted[0]?.id ?? null;
  const selectedExpense = filteredSorted.find((e) => e.id === effectiveSelectedExpenseId) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Shared costs"
        title="Expenses"
        description={`${filteredSorted.length} shown of ${expenses.length} expense${expenses.length !== 1 ? "s" : ""} · ${new Intl.NumberFormat("en-US", { style: "currency", currency }).format(filteredTotal)}`}
        actions={
          canEdit && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="app-hover-lift hidden md:inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)_320px]">
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          <div className="sticky top-14 z-[8] rounded-xl border border-border/65 bg-[hsl(var(--card)/0.92)] p-3 shadow-sm backdrop-blur-md transition-shadow duration-200 dark:bg-card/82">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:text-xs">
                <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> My expenses
              </label>
              <span className="hidden min-[560px]:block h-4 w-px bg-border shrink-0" aria-hidden />
              <label className="flex flex-wrap items-center gap-1.5 text-xs gap-y-2">
                <span className="sr-only">Sort</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="date">Date · newest first</option>
                  <option value="amount">Amount · high to low</option>
                  <option value="payer">Paid by · A-Z</option>
                  <option value="category">Category · A-Z</option>
                </select>
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="max-w-[9rem] flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs sm:max-w-[11rem]">
                <option value="">Every category</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select value={payerFilter} onChange={(e) => setPayerFilter(e.target.value)} className="max-w-[11rem] flex-[1_1_auto] rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
                <option value="">Every payer</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name}
                  </option>
                ))}
              </select>
              <span className="ml-auto whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                Balance (you){" "}
                <span className={myNet >= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
                  {formatCurrency(myNet, currency)}
                </span>
              </span>
            </div>
          </div>
          <ExpenseList
          tripId={tripId}
          expenses={filteredSorted}
          currency={currency}
          selectedExpenseId={effectiveSelectedExpenseId}
          onSelectExpense={setSelectedExpenseId}
          onAddClick={() => setAddOpen(true)}
        />
        </div>
        <aside className="hidden space-y-4 lg:block">
          <div className="sticky top-24">
            <ExpenseDetailPanel expense={selectedExpense} currency={currency} />
          </div>
        </aside>
        <aside className="space-y-4">
          <BalanceSummary
            balances={balances}
            settlements={settlements}
            currency={currency}
          />
          <ExpenseCategoryChart expenses={filteredSorted} currency={currency} />
        </aside>
      </div>

      <AddExpenseDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        tripId={tripId}
        currency={currency}
        onExpenseCreated={(id) => revealExpense(id, { syncUrl: true })}
      />

      {canEdit ? (
        <StickyActionBar
          primary={
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add expense
            </button>
          }
        />
      ) : null}
    </>
  );
}
