"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion } from "framer-motion";
import { staggerContainer, listItem } from "@/lib/motion";
import { Receipt, Plus, Map, Package } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ROUTES } from "@/lib/constants";
import { ExpenseCard } from "./ExpenseCard";
import { useTripContext } from "@/components/trip/TripContext";
import type { ExpenseSerialized } from "./types";

interface ExpenseListProps {
  tripId: string;
  expenses: ExpenseSerialized[];
  currency: string;
  selectedExpenseId?: string | null;
  onSelectExpense?: (id: string) => void;
  onAddClick: () => void;
}

export function ExpenseList({
  tripId,
  expenses,
  currency,
  selectedExpenseId,
  onSelectExpense,
  onAddClick,
}: ExpenseListProps) {
  const { canEdit } = useTripContext();
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="w-7 h-7" />}
        title="No expenses yet"
        description="Log a shared expense to start tracking who owes what."
        action={
          <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
            {canEdit && (
              <button
                type="button"
                onClick={onAddClick}
                className="app-hover-lift inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 min-h-11 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Log first expense
              </button>
            )}
            <Link
              href={ROUTES.tripSupplies(tripId)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 min-h-11 text-sm font-medium transition-colors hover:bg-muted/70"
            >
              <Package className="h-4 w-4 shrink-0" /> Supplies
            </Link>
            <Link
              href={ROUTES.tripItinerary(tripId)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 min-h-11 text-sm font-medium transition-colors hover:bg-muted/70"
            >
              <Map className="h-4 w-4 shrink-0" /> Itinerary
            </Link>
          </div>
        }
      />
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const active = document.activeElement as HTMLElement | null;
    const index = expenses.findIndex((item) => refs.current[item.id]?.contains(active ?? null));
    if (index < 0) return;
    e.preventDefault();
    const nextIndex =
      e.key === "ArrowDown" ? Math.min(expenses.length - 1, index + 1) : Math.max(0, index - 1);
    const next = expenses[nextIndex];
    if (!next) return;
    onSelectExpense?.(next.id);
    refs.current[next.id]?.querySelector<HTMLElement>("button, [href], [tabindex]")?.focus();
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-3"
      onKeyDown={handleKeyDown}
    >
      {expenses.map((expense) => (
        <motion.div key={expense.id} variants={listItem} ref={(el) => { refs.current[expense.id] = el; }}>
          <ExpenseCard
            expense={expense}
            currency={currency}
            selected={selectedExpenseId === expense.id}
            onSelect={() => onSelectExpense?.(expense.id)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
