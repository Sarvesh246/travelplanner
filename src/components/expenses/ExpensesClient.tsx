"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StickyActionBar } from "@/components/layout/StickyActionBar";
import { Plus } from "lucide-react";
import { ExpenseList } from "./ExpenseList";
import { BalanceSummary } from "./BalanceSummary";
import { ExpenseCategoryChart } from "./ExpenseCategoryChart";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { ExpenseDetailPanel } from "./ExpenseDetailPanel";
import { useTripContext } from "@/components/trip/TripContext";
import type { MemberBalance, Settlement } from "@/lib/balance-calculator";
import type { ExpenseSerialized } from "./types";

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
  const { canEdit } = useTripContext();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  const total = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const effectiveSelectedExpenseId =
    selectedExpenseId && expenses.some((e) => e.id === selectedExpenseId)
      ? selectedExpenseId
      : expenses[0]?.id ?? null;
  const selectedExpense = expenses.find((e) => e.id === effectiveSelectedExpenseId) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Shared costs"
        title="Expenses"
        description={`${expenses.length} expense${expenses.length !== 1 ? "s" : ""} · ${new Intl.NumberFormat("en-US", { style: "currency", currency }).format(total)} total`}
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
        <ExpenseList
          tripId={tripId}
          expenses={expenses}
          currency={currency}
          selectedExpenseId={effectiveSelectedExpenseId}
          onSelectExpense={setSelectedExpenseId}
          onAddClick={() => setAddOpen(true)}
        />
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
          <ExpenseCategoryChart expenses={expenses} currency={currency} />
        </aside>
      </div>

      <AddExpenseDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        tripId={tripId}
        currency={currency}
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
