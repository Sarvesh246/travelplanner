"use client";

import { useState } from "react";
import {
  Receipt,
  ExternalLink,
  Trash2,
  MoreHorizontal,
  Tag,
  Users,
  CircleDollarSign,
  ChevronDown,
  Link2,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { AvatarGroup } from "@/components/shared/AvatarGroup";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useTripContext } from "@/components/trip/TripContext";
import { deleteExpense, markSharePaid, restoreExpense } from "@/actions/expenses";
import { ROUTES } from "@/lib/constants";
import { expenseAnchorForId } from "@/lib/deep-link-hash";
import { toast } from "sonner";
import type { ExpenseSerialized } from "./types";

interface ExpenseCardProps {
  tripId: string;
  expense: ExpenseSerialized;
  currency: string;
  selected?: boolean;
  onSelect?: () => void;
}

const SPLIT_MODE_LABELS: Record<string, string> = {
  EQUAL: "Equal split",
  WEIGHTED: "Weighted",
  CUSTOM: "Custom",
};

export function ExpenseCard({
  tripId,
  expense,
  currency,
  selected = false,
  onSelect,
}: ExpenseCardProps) {
  const { canEdit, currentUser } = useTripContext();
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const myShare = expense.shares.find((s) => s.userId === currentUser.id);

  async function toggleMine() {
    if (!myShare) return;
    try {
      await markSharePaid(myShare.id, !myShare.hasPaid);
      toast.success(myShare.hasPaid ? "Marked unpaid" : "Marked paid");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update your share. Please try again.");
    }
  }

  async function copyExpenseDeepLink(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}${ROUTES.tripExpenses(tripId)}#${expenseAnchorForId(expense.id)}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", { description: "Anyone with trip access can open it after signing in." });
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function handleDelete() {
    try {
      await deleteExpense(expense.id);
      toast.success("Expense removed", {
        action: {
          label: "Undo",
          onClick: () => {
            void restoreExpense(expense.id);
          },
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove this expense. Please try again.");
    }
  }

  return (
    <>
      <div
        className={cn(
          "app-surface app-hover-lift group relative overflow-hidden rounded-2xl",
          selected && "ring-2 ring-primary/35"
        )}
      >
        <button
          type="button"
          className="absolute inset-0 z-[1] hidden md:block"
          onClick={onSelect}
          aria-label={`Select expense ${expense.title}`}
        />
        <div className="relative z-[2] p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.12)]">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{expense.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    <UserAvatar name={expense.paidBy.name} avatarUrl={expense.paidBy.avatarUrl} size="xs" />
                    <span>{expense.paidBy.name} paid</span>
                    <span>·</span>
                    <span>{formatDate(expense.expenseDate)}</span>
                    {expense.category && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {expense.category}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <p className="font-bold text-lg tabular-nums">
                  {formatCurrency(expense.totalAmount, currency)}
                </p>
              </div>
            </div>
            {canEdit ? (
              <div className="relative z-[6]">
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors md:hidden"
                  aria-label="Expense options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-popover border border-border rounded-xl shadow-lg py-1 z-20">
                      <button
                        type="button"
                        onClick={(e) => void copyExpenseDeepLink(e)}
                        className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5 shrink-0" /> Copy trip link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          setConfirmDelete(true);
                        }}
                        className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => void copyExpenseDeepLink(e)}
                className="relative z-[6] flex md:hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/80 hover:text-primary transition-colors"
                aria-label="Copy link to expense"
              >
                <Link2 className="w-4 h-4" />
              </button>
            )}

            <div className="pointer-events-none absolute right-14 top-4 z-[5] hidden items-center md:flex md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:pointer-events-auto md:group-hover:opacity-100">
              <button
                type="button"
                title="Copy link to this expense"
                aria-label={`Copy expense link for ${expense.title}`}
                className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-card/90 text-muted-foreground shadow-sm transition-colors hover:border-primary/35 hover:bg-primary/10 hover:text-primary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void copyExpenseDeepLink(e);
                }}
              >
                <Link2 className="h-4 w-4" />
              </button>
            </div>

            {canEdit ? (
              <div className="pointer-events-none absolute right-11 top-4 z-[5] hidden items-center gap-1 md:flex md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:pointer-events-auto md:group-hover:opacity-100">
                <button
                  type="button"
                  title={expanded ? "Hide split detail" : "View split detail"}
                  aria-expanded={expanded}
                  className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-card/90 text-muted-foreground shadow-sm transition-colors hover:border-primary/35 hover:bg-primary/10 hover:text-primary"
                  onClick={() => setExpanded((v) => !v)}
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                </button>
                {myShare && expense.paidById !== currentUser.id ? (
                  <button
                    type="button"
                    title={myShare.hasPaid ? "Mark your share unpaid" : "Mark your share paid"}
                    className={cn(
                      "pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition-colors",
                      myShare.hasPaid
                        ? "border-success/45 bg-success/10 text-success hover:bg-success/15"
                        : "border-border/70 bg-card/90 text-muted-foreground hover:border-primary/35 hover:bg-primary/10 hover:text-primary"
                    )}
                    onClick={() => void toggleMine()}
                  >
                    <CircleDollarSign className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  title="Delete expense"
                  aria-label={`Delete ${expense.title}`}
                  className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-card/90 text-muted-foreground shadow-sm transition-colors hover:border-destructive/45 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <AvatarGroup
                users={expense.shares.map((s) => ({
                  id: s.userId,
                  name: s.user.name,
                  avatarUrl: s.user.avatarUrl,
                }))}
                size="xs"
                maxVisible={5}
              />
              <span className="text-xs text-muted-foreground ml-1">
                {SPLIT_MODE_LABELS[expense.splitMode]}
              </span>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary hover:underline"
            >
              {expanded ? "Hide" : "View"} shares
            </button>
          </div>

          {myShare && expense.paidById !== currentUser.id && (
            <div className="mt-2 flex items-center justify-between text-xs bg-muted/40 rounded-lg px-3 py-2">
              <span className="text-muted-foreground">Your share:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {formatCurrency(getShareAmount(expense, myShare), currency)}
                </span>
                <button
                  onClick={toggleMine}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${
                    myShare.hasPaid
                      ? "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] dark:bg-[hsl(var(--success)/0.15)]"
                      : "bg-[hsl(var(--accent)/0.1)] text-[hsl(var(--accent))] dark:bg-[hsl(var(--accent)/0.15)] hover:bg-[hsl(var(--accent)/0.15)]"
                  }`}
                >
                  {myShare.hasPaid ? "Paid" : "Unpaid"}
                </button>
              </div>
            </div>
          )}
        </div>

        {expanded && (
          <div className="px-4 pb-4">
            <div className="bg-muted/40 rounded-xl p-3 space-y-2">
              {expense.shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserAvatar name={share.user.name} avatarUrl={share.user.avatarUrl} size="xs" />
                    <span className="truncate">{share.user.name}</span>
                    {share.userId === expense.paidById && (
                      <span className="text-[10px] font-semibold text-primary">PAYER</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="tabular-nums font-medium">
                      {formatCurrency(getShareAmount(expense, share), currency)}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        share.hasPaid
                          ? "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] dark:bg-[hsl(var(--success)/0.15)]"
                          : "bg-[hsl(var(--accent)/0.1)] text-[hsl(var(--accent))] dark:bg-[hsl(var(--accent)/0.15)]"
                      }`}
                    >
                      {share.hasPaid ? "Paid" : "Owes"}
                    </span>
                  </div>
                </div>
              ))}
              {expense.receiptUrl && (
                <a
                  href={expense.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Receipt
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${expense.title}"?`}
        description="Shares and paid statuses will be removed too."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </>
  );
}

function getShareAmount(expense: ExpenseSerialized, share: { weight: number | null; customAmount: number | null }): number {
  if (expense.splitMode === "CUSTOM" && share.customAmount !== null) return share.customAmount;
  if (expense.splitMode === "WEIGHTED" && share.weight !== null) {
    const total = expense.shares.reduce((s, x) => s + (x.weight ?? 1), 0);
    return (share.weight / total) * expense.totalAmount;
  }
  return expense.totalAmount / expense.shares.length;
}
