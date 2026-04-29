"use client";

import { useState, useMemo } from "react";
import { X, Loader2, Receipt, Upload } from "lucide-react";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import {
  useTripEditingPresenceField,
} from "@/components/collaboration/TripEditingPresenceProvider";
import { EditingPresenceNotice } from "@/components/collaboration/EditingPresenceNotice";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { useTripContext } from "@/components/trip/TripContext";
import { createExpense } from "@/actions/expenses";
import { createClient } from "@/lib/supabase/client";
import { SplitEditor, type SplitEditorRow } from "./SplitEditor";
import type { SplitMode } from "@/lib/expense-splits";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLoading } from "@/hooks/useLoading";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  currency: string;
  onExpenseCreated?: (expenseId: string) => void;
}

export function AddExpenseDialog({
  open,
  onOpenChange,
  tripId,
  currency,
  onExpenseCreated,
}: AddExpenseDialogProps) {
  const { startLoading, stopLoading } = useLoading();
  const { members, currentUser } = useTripContext();

  const defaultRows = useMemo<SplitEditorRow[]>(
    () =>
      members.map((m) => ({
        userId: m.userId,
        included: true,
        weight: 1,
        customAmount: 0,
      })),
    [members]
  );

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paidById, setPaidById] = useState(currentUser.id);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<SplitMode>("EQUAL");
  const [rows, setRows] = useState<SplitEditorRow[]>(defaultRows);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const memberLookup = members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    avatarUrl: m.user.avatarUrl,
  }));
  const surfaceId = `expense-dialog:${tripId}`;
  const titlePresence = useTripEditingPresenceField({
    surfaceId,
    surfaceLabel: "Add expense",
    resourceId: "new-expense",
    resourceLabel: "New expense",
    fieldKey: "title",
    fieldLabel: "expense title",
  });
  const datePresence = useTripEditingPresenceField({
    surfaceId,
    surfaceLabel: "Add expense",
    resourceId: "new-expense",
    resourceLabel: "New expense",
    fieldKey: "date",
    fieldLabel: "expense date",
  });
  const categoryPresence = useTripEditingPresenceField({
    surfaceId,
    surfaceLabel: "Add expense",
    resourceId: "new-expense",
    resourceLabel: "New expense",
    fieldKey: "category",
    fieldLabel: "category",
  });
  const payerPresence = useTripEditingPresenceField({
    surfaceId,
    surfaceLabel: "Add expense",
    resourceId: "new-expense",
    resourceLabel: "New expense",
    fieldKey: "paid-by",
    fieldLabel: "paid by",
  });

  function reset() {
    setTitle("");
    setCategory(EXPENSE_CATEGORIES[0]);
    setTotalAmount(0);
    setPaidById(currentUser.id);
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setMode("EQUAL");
    setRows(defaultRows);
    setReceipt(null);
  }

  async function uploadReceipt(file: File): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${tripId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("receipts").upload(path, file, { upsert: false });
    if (error) {
      toast.error("Receipt upload failed: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("receipts").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (totalAmount <= 0) {
      toast.error("Enter an amount greater than 0");
      return;
    }
    const included = rows.filter((r) => r.included);
    if (included.length === 0) {
      toast.error("Select at least one participant");
      return;
    }
    setLoading(true);
    startLoading("Adding expense...");
    try {
      const receiptUrl = receipt ? await uploadReceipt(receipt) : undefined;

      const displayTitle = title.trim();
      const { expense } = await createExpense(tripId, {
        title: displayTitle,
        category,
        totalAmount,
        splitMode: mode,
        paidById,
        expenseDate,
        receiptUrl: receiptUrl ?? undefined,
        shares: included.map((r) => ({
          userId: r.userId,
          weight: mode === "WEIGHTED" ? r.weight : undefined,
          customAmount: mode === "CUSTOM" ? r.customAmount : undefined,
        })),
      });

      await router.refresh();
      reset();
      onOpenChange(false);
      toast.success("Expense logged", {
        description: displayTitle,
        action: onExpenseCreated
          ? {
              label: "View",
              onClick: () => onExpenseCreated(expense.id),
            }
          : undefined,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not log this expense. Please try again.");
    } finally {
      setLoading(false);
      stopLoading();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative mt-auto flex max-h-[min(94dvh,44rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-xl sm:my-8 sm:mt-0 sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-base">Add expense</h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[min(78dvh,36rem)] space-y-4 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <EditingPresenceNotice
            editors={titlePresence.surfaceEditors}
            mode="surface"
            className="mt-0"
          />
          <div>
            <label className="text-sm font-medium block mb-1.5">Title *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => {
                titlePresence.activate();
                setTitle(e.target.value);
              }}
              onFocus={titlePresence.activate}
              onBlur={titlePresence.clear}
              placeholder="Groceries, Dinner, Airbnb…"
              className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base sm:min-h-10 sm:text-sm touch-manipulation focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <EditingPresenceNotice editors={titlePresence.fieldEditors} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CurrencyInput
              label="Amount *"
              value={totalAmount}
              onChange={setTotalAmount}
              currency={currency}
              presence={{
                surfaceId,
                surfaceLabel: "Add expense",
                resourceId: "new-expense",
                resourceLabel: "New expense",
                fieldKey: "amount",
                fieldLabel: "amount",
              }}
            />
            <div>
              <label className="text-sm font-medium block mb-1.5">Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => {
                  datePresence.activate();
                  setExpenseDate(e.target.value);
                }}
                onFocus={datePresence.activate}
                onBlur={datePresence.clear}
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base sm:min-h-10 sm:text-sm touch-manipulation focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <EditingPresenceNotice editors={datePresence.fieldEditors} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  categoryPresence.activate();
                  setCategory(e.target.value);
                }}
                onFocus={categoryPresence.activate}
                onBlur={categoryPresence.clear}
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base sm:min-h-10 sm:text-sm touch-manipulation focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <EditingPresenceNotice editors={categoryPresence.fieldEditors} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Paid by</label>
              <select
                value={paidById}
                onChange={(e) => {
                  payerPresence.activate();
                  setPaidById(e.target.value);
                }}
                onFocus={payerPresence.activate}
                onBlur={payerPresence.clear}
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base sm:min-h-10 sm:text-sm touch-manipulation focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.user.name}</option>
                ))}
              </select>
              <EditingPresenceNotice editors={payerPresence.fieldEditors} />
            </div>
          </div>

          <div className="pt-2">
            <SplitEditor
              totalAmount={totalAmount}
              currency={currency}
              mode={mode}
              onModeChange={setMode}
              members={memberLookup}
              rows={rows}
              onRowsChange={setRows}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Receipt (optional)</label>
            <label className="flex items-center gap-2 border border-dashed border-border rounded-lg py-3 px-4 cursor-pointer hover:bg-muted/40 transition-colors text-sm text-muted-foreground">
              <Upload className="w-4 h-4" />
              <span className="flex-1 truncate">{receipt ? receipt.name : "Upload an image or PDF"}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 touch-manipulation"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Log expense
          </button>
        </form>
      </div>
    </div>
  );
}
