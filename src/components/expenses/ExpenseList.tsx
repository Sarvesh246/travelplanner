"use client";

import { motion } from "framer-motion";
import { staggerContainer, listItem } from "@/lib/motion";
import { Receipt, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ExpenseCard } from "./ExpenseCard";
import { useTripContext } from "@/components/trip/TripContext";
import type { ExpenseSerialized } from "./types";

interface ExpenseListProps {
  expenses: ExpenseSerialized[];
  currency: string;
  onAddClick: () => void;
}

export function ExpenseList({ expenses, currency, onAddClick }: ExpenseListProps) {
  const { canEdit } = useTripContext();

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="w-7 h-7" />}
        title="No expenses yet"
        description="Log a shared expense to start tracking who owes what."
        action={
          canEdit && (
            <button
              onClick={onAddClick}
              className="mt-2 flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Log first expense
            </button>
          )
        }
      />
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
      {expenses.map((expense) => (
        <motion.div key={expense.id} variants={listItem}>
          <ExpenseCard expense={expense} currency={currency} />
        </motion.div>
      ))}
    </motion.div>
  );
}
