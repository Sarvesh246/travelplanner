"use client";

import { CircleDollarSign, Tag, User, Users } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { ExpenseSerialized } from "./types";

export function ExpenseDetailPanel({
  expense,
  currency,
}: {
  expense: ExpenseSerialized | null;
  currency: string;
}) {
  if (!expense) {
    return (
      <div className="app-surface rounded-2xl border border-border/80 p-5 text-sm text-muted-foreground">
        Select an expense to view share details.
      </div>
    );
  }

  return (
    <div className="app-surface rounded-2xl border border-border/80 p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold">{expense.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{formatDate(expense.expenseDate)}</p>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold">{formatCurrency(expense.totalAmount, currency)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <User className="h-3.5 w-3.5" /> Paid by
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserAvatar name={expense.paidBy.name} avatarUrl={expense.paidBy.avatarUrl} size="xs" />
            {expense.paidBy.name}
          </span>
        </div>
        {expense.category ? (
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Tag className="h-3.5 w-3.5" /> Category
            </span>
            <span>{expense.category}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-5 border-t border-border/70 pt-4">
        <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          Shares
        </p>
        <div className="space-y-2">
          {expense.shares.map((share) => {
            const amount =
              expense.splitMode === "CUSTOM" && share.customAmount !== null
                ? share.customAmount
                : expense.splitMode === "WEIGHTED" && share.weight !== null
                  ? (share.weight / expense.shares.reduce((s, x) => s + (x.weight ?? 1), 0)) * expense.totalAmount
                  : expense.totalAmount / expense.shares.length;

            return (
              <div key={share.id} className="flex items-center justify-between rounded-lg bg-muted/45 px-2.5 py-2 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <UserAvatar name={share.user.name} avatarUrl={share.user.avatarUrl} size="xs" />
                  {share.user.name}
                </span>
                <span className="inline-flex items-center gap-1 font-medium">
                  <CircleDollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatCurrency(amount, currency)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

