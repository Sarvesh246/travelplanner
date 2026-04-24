"use client";

import { useState, useMemo } from "react";
import { X, Loader2, Receipt, Upload } from "lucide-react";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { useTripContext } from "@/components/trip/TripContext";
import { createExpense } from "@/actions/expenses";
import { createClient } from "@/lib/supabase/client";
import { SplitEditor, type SplitEditorRow } from "./SplitEditor";
import type { SplitMode } from "@/lib/expense-splits";
import { toast } from "sonner";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  currency: string;
}

export function AddExpenseDialog({ open, onOpenChange, tripId, currency }: AddExpenseDialogProps) {
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

  const memberLookup = members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    avatarUrl: m.user.avatarUrl,
  }));

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
    try {
      const receiptUrl = receipt ? await uploadReceipt(receipt) : undefined;

      await createExpense(tripId, {
        title: title.trim(),
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

      toast.success("Expense logged");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-6 border-b border-border">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Title *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Groceries, Dinner, Airbnb…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CurrencyInput
              label="Amount *"
              value={totalAmount}
              onChange={setTotalAmount}
              currency={currency}
            />
            <div>
              <label className="text-sm font-medium block mb-1.5">Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Paid by</label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.user.name}</option>
                ))}
              </select>
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
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Log expense
          </button>
        </form>
      </div>
    </div>
  );
}
