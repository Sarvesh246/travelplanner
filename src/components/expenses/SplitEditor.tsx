"use client";

import { useMemo } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { computeShares, validateCustomSplit, type SplitMode } from "@/lib/expense-splits";

export interface SplitEditorMember {
  userId: string;
  name: string;
  avatarUrl: string | null;
}

export interface SplitEditorRow {
  userId: string;
  included: boolean;
  weight: number;
  customAmount: number;
}

interface SplitEditorProps {
  totalAmount: number;
  currency: string;
  mode: SplitMode;
  onModeChange: (mode: SplitMode) => void;
  members: SplitEditorMember[];
  rows: SplitEditorRow[];
  onRowsChange: (rows: SplitEditorRow[]) => void;
}

const MODES: { value: SplitMode; label: string; description: string }[] = [
  { value: "EQUAL", label: "Equal", description: "Everyone pays the same" },
  { value: "WEIGHTED", label: "Weighted", description: "Per-member weights" },
  { value: "CUSTOM", label: "Custom", description: "Exact amounts" },
];

export function SplitEditor({
  totalAmount,
  currency,
  mode,
  onModeChange,
  members,
  rows,
  onRowsChange,
}: SplitEditorProps) {
  const included = rows.filter((r) => r.included);

  const shares = useMemo(() => {
    return computeShares(
      totalAmount,
      included.map((r) => ({
        userId: r.userId,
        name: "",
        weight: r.weight,
        customAmount: r.customAmount,
      })),
      mode
    );
  }, [totalAmount, included, mode]);

  const customValidation = useMemo(() => {
    if (mode !== "CUSTOM") return null;
    return validateCustomSplit(
      totalAmount,
      included.map((r) => ({ userId: r.userId, name: "", customAmount: r.customAmount }))
    );
  }, [totalAmount, included, mode]);

  function updateRow(userId: string, patch: Partial<SplitEditorRow>) {
    onRowsChange(rows.map((r) => (r.userId === userId ? { ...r, ...patch } : r)));
  }

  function toggleAll(include: boolean) {
    onRowsChange(rows.map((r) => ({ ...r, included: include })));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Split method</label>
        <div className="flex gap-1 text-xs">
          <button type="button" onClick={() => toggleAll(true)} className="text-primary hover:underline">
            All
          </button>
          <span className="text-border">|</span>
          <button type="button" onClick={() => toggleAll(false)} className="text-muted-foreground hover:text-foreground">
            None
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-1 bg-muted/60 rounded-xl">
        {MODES.map((m) => {
          const active = mode === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => onModeChange(m.value)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg text-sm transition-all",
                active
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{m.label}</span>
              <span className="text-[10px] text-muted-foreground font-normal">{m.description}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-muted/30 rounded-xl border border-border overflow-hidden">
        {rows.map((row) => {
          const member = members.find((m) => m.userId === row.userId);
          const share = shares.find((s) => s.userId === row.userId);
          if (!member) return null;

          return (
            <div
              key={row.userId}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0 transition-colors",
                !row.included && "opacity-50"
              )}
            >
              <input
                type="checkbox"
                checked={row.included}
                onChange={(e) => updateRow(row.userId, { included: e.target.checked })}
                className="w-4 h-4 rounded accent-primary shrink-0"
              />
              <UserAvatar name={member.name} avatarUrl={member.avatarUrl} size="xs" />
              <span className="text-sm flex-1 truncate">{member.name}</span>

              {mode === "EQUAL" && (
                <span className="text-sm font-medium tabular-nums">
                  {row.included ? formatCurrency(share?.amount ?? 0, currency) : "—"}
                </span>
              )}

              {mode === "WEIGHTED" && (
                <>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    disabled={!row.included}
                    value={row.weight}
                    onChange={(e) => updateRow(row.userId, { weight: parseFloat(e.target.value) || 0 })}
                    className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                  <span className="text-sm font-medium tabular-nums w-20 text-right">
                    {row.included ? formatCurrency(share?.amount ?? 0, currency) : "—"}
                  </span>
                </>
              )}

              {mode === "CUSTOM" && (
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  disabled={!row.included}
                  value={row.customAmount}
                  onChange={(e) => updateRow(row.userId, { customAmount: parseFloat(e.target.value) || 0 })}
                  className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
              )}
            </div>
          );
        })}
      </div>

      {mode === "CUSTOM" && customValidation && (
        <div
          className={cn(
            "text-xs flex items-center justify-between px-1",
            customValidation.valid ? "text-success" : "text-warning"
          )}
        >
          <span>
            {customValidation.valid
              ? "Amounts balance to total"
              : customValidation.remaining > 0
                ? `${formatCurrency(customValidation.remaining, currency)} remaining`
                : `${formatCurrency(Math.abs(customValidation.remaining), currency)} over`}
          </span>
          <span className="tabular-nums font-medium">
            of {formatCurrency(totalAmount, currency)}
          </span>
        </div>
      )}

      {included.length === 0 && (
        <p className="text-xs text-warning text-center">Select at least one participant</p>
      )}
    </div>
  );
}
