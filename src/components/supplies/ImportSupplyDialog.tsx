"use client";

import { useMemo, useState } from "react";
import { FileText, Loader2, Sparkles, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { commitSupplyImport, parseSupplyImport } from "@/actions/supplies";
import { SUPPLY_CATEGORIES } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";
import { useTripContext } from "@/components/trip/TripContext";
import type { SupplyImportDraftRow } from "@/lib/supplies/import";

interface ImportSupplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  currency: string;
}

type ImportMode = "text" | "pdf";
type DraftRow = SupplyImportDraftRow & { selected: boolean };

export function ImportSupplyDialog({
  open,
  onOpenChange,
  tripId,
  currency,
}: ImportSupplyDialogProps) {
  const router = useRouter();
  const { members } = useTripContext();
  const [mode, setMode] = useState<ImportMode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<"text" | "pdf">("text");
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedRows = useMemo(() => rows.filter((row) => row.selected), [rows]);
  const selectedTotal = selectedRows.reduce(
    (sum, row) => sum + (row.estimatedCost ?? 0) * row.quantityNeeded,
    0
  );

  function reset() {
    setMode("text");
    setText("");
    setFile(null);
    setSourceType("text");
    setRows([]);
    setParsing(false);
    setSaving(false);
  }

  function close() {
    reset();
    onOpenChange(false);
  }

  async function handleParse() {
    const fd = new FormData();
    if (mode === "text") {
      fd.set("text", text);
    } else if (file) {
      fd.set("file", file);
    }

    setParsing(true);
    try {
      const result = await parseSupplyImport(tripId, fd);
      setSourceType(result.sourceType);
      setRows(result.rows.map((row) => ({ ...row, selected: true })));
      toast.success(`Found ${result.rows.length} supply item${result.rows.length === 1 ? "" : "s"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not parse this supply list.");
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (selectedRows.length === 0) {
      toast.error("Select at least one item to import");
      return;
    }

    setSaving(true);
    try {
      await commitSupplyImport(tripId, {
        sourceType,
        rows: selectedRows.map(toCommitRow),
      });
      await router.refresh();
      toast.success(
        `Imported ${selectedRows.length} supply item${selectedRows.length === 1 ? "" : "s"}`
      );
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not import these items.");
    } finally {
      setSaving(false);
    }
  }

  function updateRow(index: number, patch: Partial<DraftRow>) {
    setRows((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
    );
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
      <div className="relative mt-auto flex max-h-[min(94dvh,50rem)] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-xl sm:my-8 sm:mt-0 sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border p-5 sm:p-6">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <h2 className="text-base font-semibold">Import supply list</h2>
              <p className="truncate text-xs text-muted-foreground">
                Paste a checklist or upload a text PDF, then review before saving.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Close import dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <div className="flex w-full rounded-xl border border-border bg-background/70 p-1">
            {(["text", "pdf"] as const).map((nextMode) => (
              <button
                key={nextMode}
                type="button"
                onClick={() => setMode(nextMode)}
                className={cn(
                  "flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors",
                  mode === nextMode
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {nextMode === "text" ? <FileText className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                {nextMode === "text" ? "Paste text" : "Upload PDF"}
              </button>
            ))}
          </div>

          {mode === "text" ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Supply checklist</label>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="2 tents&#10;Bear Spray&#10;Cooler (Will)&#10;Hiking shoes for each person"
                className="min-h-48 w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Text PDF</label>
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/60 px-4 py-5 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/40">
                <Upload className="h-5 w-5" />
                <span className="max-w-full truncate">{file ? file.name : "Choose a PDF up to 5MB"}</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleParse()}
              disabled={parsing || (mode === "text" ? !text.trim() : !file)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {rows.length > 0 ? "Parse again" : "Parse list"}
            </button>
            {rows.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {selectedRows.length} selected
                {selectedTotal > 0 ? `, ${formatCurrency(selectedTotal, currency)} estimated` : ""}
              </p>
            ) : null}
          </div>

          {rows.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Review import</h3>
                <button
                  type="button"
                  onClick={() =>
                    setRows((prev) => {
                      const nextSelected = !prev.every((row) => row.selected);
                      return prev.map((row) => ({ ...row, selected: nextSelected }));
                    })
                  }
                  className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  {rows.every((row) => row.selected) ? "Clear all" : "Select all"}
                </button>
              </div>

              <div className="space-y-3 lg:hidden">
                {rows.map((row, index) => (
                  <MobileDraftRow
                    key={`${row.sourceText ?? row.name}:${index}`}
                    row={row}
                    index={index}
                    members={members}
                    onUpdate={updateRow}
                    onRemove={removeRow}
                  />
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-2xl border border-border/70 lg:block">
                <div className="grid grid-cols-[2.25rem_minmax(11rem,1.3fr)_8rem_5.5rem_7rem_minmax(9rem,1fr)_minmax(10rem,1fr)_2.75rem] gap-2 border-b border-border/70 bg-muted/45 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span />
                  <span>Item</span>
                  <span>Category</span>
                  <span>Qty</span>
                  <span>Each</span>
                  <span>Bringer</span>
                  <span>Notes</span>
                  <span />
                </div>
                <div className="divide-y divide-border/70 bg-card">
                  {rows.map((row, index) => (
                    <DesktopDraftRow
                      key={`${row.sourceText ?? row.name}:${index}`}
                      row={row}
                      index={index}
                      members={members}
                      onUpdate={updateRow}
                      onRemove={removeRow}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={close}
            className="min-h-11 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={saving || selectedRows.length === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Import selected
          </button>
        </div>
      </div>
    </div>
  );
}

function toCommitRow(row: DraftRow): SupplyImportDraftRow {
  return {
    name: row.name,
    category: row.category,
    quantityNeeded: row.quantityNeeded,
    estimatedCost: row.estimatedCost,
    whoBringsId: row.whoBringsId,
    notes: row.notes,
    sourceText: row.sourceText,
    confidence: row.confidence,
    warnings: row.warnings,
  };
}

function DesktopDraftRow({
  row,
  index,
  members,
  onUpdate,
  onRemove,
}: {
  row: DraftRow;
  index: number;
  members: ReturnType<typeof useTripContext>["members"];
  onUpdate: (index: number, patch: Partial<DraftRow>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-[2.25rem_minmax(11rem,1.3fr)_8rem_5.5rem_7rem_minmax(9rem,1fr)_minmax(10rem,1fr)_2.75rem] gap-2 px-3 py-3">
      <RowFields row={row} index={index} members={members} onUpdate={onUpdate} onRemove={onRemove} />
    </div>
  );
}

function MobileDraftRow({
  row,
  index,
  members,
  onUpdate,
  onRemove,
}: {
  row: DraftRow;
  index: number;
  members: ReturnType<typeof useTripContext>["members"];
  onUpdate: (index: number, patch: Partial<DraftRow>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <input
          type="checkbox"
          checked={row.selected}
          onChange={(event) => onUpdate(index, { selected: event.target.checked })}
          aria-label={`Select ${row.name}`}
          className="h-4 w-4 rounded border-input"
        />
        <input
          value={row.name}
          onChange={(event) => onUpdate(index, { name: event.target.value })}
          aria-label="Item name"
          className="min-h-10 min-w-0 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
        />
        <RemoveButton onRemove={() => onRemove(index)} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <CategorySelect value={row.category} onChange={(category) => onUpdate(index, { category })} />
        <QuantityInput value={row.quantityNeeded} onChange={(quantityNeeded) => onUpdate(index, { quantityNeeded })} />
        <CostInput value={row.estimatedCost} onChange={(estimatedCost) => onUpdate(index, { estimatedCost })} />
        <BringerSelect value={row.whoBringsId} members={members} onChange={(whoBringsId) => onUpdate(index, { whoBringsId })} />
      </div>
      <textarea
        value={row.notes ?? ""}
        onChange={(event) => onUpdate(index, { notes: event.target.value || null })}
        aria-label="Notes"
        placeholder="Notes"
        className="mt-2 min-h-16 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
      <RowWarnings row={row} />
    </div>
  );
}

function RowFields({
  row,
  index,
  members,
  onUpdate,
  onRemove,
}: {
  row: DraftRow;
  index: number;
  members: ReturnType<typeof useTripContext>["members"];
  onUpdate: (index: number, patch: Partial<DraftRow>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <>
      <label className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={row.selected}
          onChange={(event) => onUpdate(index, { selected: event.target.checked })}
          aria-label={`Select ${row.name}`}
          className="h-4 w-4 rounded border-input"
        />
      </label>
      <div className="min-w-0">
        <input
          value={row.name}
          onChange={(event) => onUpdate(index, { name: event.target.value })}
          aria-label="Item name"
          className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
        />
        <RowWarnings row={row} />
      </div>
      <CategorySelect value={row.category} onChange={(category) => onUpdate(index, { category })} />
      <QuantityInput value={row.quantityNeeded} onChange={(quantityNeeded) => onUpdate(index, { quantityNeeded })} />
      <CostInput value={row.estimatedCost} onChange={(estimatedCost) => onUpdate(index, { estimatedCost })} />
      <BringerSelect value={row.whoBringsId} members={members} onChange={(whoBringsId) => onUpdate(index, { whoBringsId })} />
      <input
        value={row.notes ?? ""}
        onChange={(event) => onUpdate(index, { notes: event.target.value || null })}
        aria-label="Notes"
        className="h-10 min-w-0 rounded-lg border border-input bg-background px-3 text-sm"
      />
      <RemoveButton onRemove={() => onRemove(index)} />
    </>
  );
}

function CategorySelect({
  value,
  onChange,
}: {
  value: DraftRow["category"];
  onChange: (value: DraftRow["category"]) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as DraftRow["category"])}
      aria-label="Category"
      className="h-10 min-w-0 rounded-lg border border-input bg-background px-2 text-sm"
    >
      {SUPPLY_CATEGORIES.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </select>
  );
}

function QuantityInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(event) => onChange(Math.max(0, parseInt(event.target.value, 10) || 0))}
      aria-label="Quantity needed"
      className="h-10 min-w-0 rounded-lg border border-input bg-background px-2 text-sm"
    />
  );
}

function CostInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      step="0.01"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value ? Math.max(0, Number(event.target.value)) : null)}
      aria-label="Estimated cost"
      placeholder="Each"
      className="h-10 min-w-0 rounded-lg border border-input bg-background px-2 text-sm"
    />
  );
}

function BringerSelect({
  value,
  members,
  onChange,
}: {
  value: string | null;
  members: ReturnType<typeof useTripContext>["members"];
  onChange: (value: string | null) => void;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value || null)}
      aria-label="Who brings"
      className="h-10 min-w-0 rounded-lg border border-input bg-background px-2 text-sm"
    >
      <option value="">Unassigned</option>
      {members.map((member) => (
        <option key={member.userId} value={member.userId}>
          {member.user.name}
        </option>
      ))}
    </select>
  );
}

function RemoveButton({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-destructive/35 bg-destructive/10 text-destructive transition-colors hover:bg-destructive/15"
      aria-label="Remove row"
      title="Remove row"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function RowWarnings({ row }: { row: DraftRow }) {
  if (row.warnings.length === 0 && row.confidence >= 0.55) return null;

  return (
    <div className="mt-1 space-y-1 text-xs text-warning">
      {row.confidence < 0.55 ? <p>Low confidence. Review this row.</p> : null}
      {row.warnings.map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
    </div>
  );
}
