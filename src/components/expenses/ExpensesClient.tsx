"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Plus } from "lucide-react";
import { ExpenseList } from "./ExpenseList";
import { BalanceSummary } from "./BalanceSummary";
import { ExpenseCategoryChart } from "./ExpenseCategoryChart";
import { AddExpenseDialog } from "./AddExpenseDialog";
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

  const total = expenses.reduce((sum, e) => sum + e.totalAmount, 0);

  return (
    <>
      <PageHeader
        title="Expenses"
        description={`${expenses.length} expense${expenses.length !== 1 ? "s" : ""} · ${new Intl.NumberFormat("en-US", { style: "currency", currency }).format(total)} total`}
        actions={
          canEdit && (
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          )
        }
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <ExpenseList
          expenses={expenses}
          currency={currency}
          onAddClick={() => setAddOpen(true)}
        />
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
    </>
  );
}
