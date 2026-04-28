"use client";

import { useState } from "react";
import { X, Plus, Loader2, Vote as VoteIcon, Trash2 } from "lucide-react";
import { createVote } from "@/actions/votes";
import { toast } from "sonner";
import { VoteTopicType } from "@prisma/client";

interface CreateVoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
}

interface OptionDraft {
  id: string;
  label: string;
  dateStart: string;
  dateEnd: string;
}

const TOPIC_OPTIONS: { value: VoteTopicType; label: string }[] = [
  { value: "DATES", label: "Dates" },
  { value: "DESTINATION", label: "Destination" },
  { value: "ACTIVITY", label: "Activity" },
  { value: "BUDGET", label: "Budget" },
  { value: "ACCOMMODATION", label: "Accommodation" },
  { value: "OTHER", label: "Other" },
];

function newOption(): OptionDraft {
  return { id: Math.random().toString(36).slice(2), label: "", dateStart: "", dateEnd: "" };
}

export function CreateVoteDialog({ open, onOpenChange, tripId }: CreateVoteDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicType, setTopicType] = useState<VoteTopicType>("OTHER");
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>([newOption(), newOption()]);
  const [loading, setLoading] = useState(false);

  const useDateRange = topicType === "DATES";

  function reset() {
    setTitle("");
    setDescription("");
    setTopicType("OTHER");
    setAllowMultiple(false);
    setIsAnonymous(false);
    setDeadline("");
    setOptions([newOption(), newOption()]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const cleaned = options
      .map((o) => ({
        label: o.label.trim(),
        dateStart: o.dateStart || undefined,
        dateEnd: o.dateEnd || undefined,
      }))
      .filter((o) => o.label || o.dateStart);

    if (cleaned.length < 2) {
      toast.error("Provide at least two options");
      return;
    }

    setLoading(true);
    try {
      await createVote(tripId, {
        title: title.trim(),
        description: description.trim() || undefined,
        topicType,
        allowMultiple,
        isAnonymous,
        deadline: deadline || undefined,
        options: cleaned.map((c) => ({
          label: c.label || `${c.dateStart}${c.dateEnd ? " – " + c.dateEnd : ""}`,
          dateStart: c.dateStart,
          dateEnd: c.dateEnd,
        })),
      });
      toast.success("Poll created");
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
            <VoteIcon className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-base">Create poll</h2>
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
            <label className="text-sm font-medium block mb-1.5">Question *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Where should we go in October?"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Add context for voters (optional)"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Topic</label>
              <select
                value={topicType}
                onChange={(e) => setTopicType(e.target.value as VoteTopicType)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TOPIC_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Deadline</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-10 md:h-auto w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex items-center gap-5 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowMultiple}
                onChange={(e) => setAllowMultiple(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              Allow multiple selections
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              Anonymous
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Options</label>
              <button
                type="button"
                onClick={() => setOptions([...options, newOption()])}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add option
              </button>
            </div>
            <div className="space-y-2">
              {options.map((o, idx) => (
                <div key={o.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      value={o.label}
                      onChange={(e) => setOptions(options.map((x) => x.id === o.id ? { ...x, label: e.target.value } : x))}
                      placeholder={useDateRange ? "Label (optional)" : `Option ${idx + 1}`}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {useDateRange && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={o.dateStart}
                          onChange={(e) => setOptions(options.map((x) => x.id === o.id ? { ...x, dateStart: e.target.value } : x))}
                          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <input
                          type="date"
                          value={o.dateEnd}
                          onChange={(e) => setOptions(options.map((x) => x.id === o.id ? { ...x, dateEnd: e.target.value } : x))}
                          min={o.dateStart}
                          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    )}
                  </div>
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setOptions(options.filter((x) => x.id !== o.id))}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create poll
          </button>
        </form>
      </div>
    </div>
  );
}
