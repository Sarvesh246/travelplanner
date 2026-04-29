"use client";

import { useState, useMemo } from "react";
import {
  Clock,
  Check,
  MoreHorizontal,
  Trash2,
  Lock,
  CalendarDays,
} from "lucide-react";
import { cn, formatDate, formatDateRange } from "@/lib/utils";
import { AvatarGroup } from "@/components/shared/AvatarGroup";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { VoteResultBar } from "./VoteResultBar";
import { castVote, closeVote, deleteVote } from "@/actions/votes";
import { useTripContext } from "@/components/trip/TripContext";
import { toast } from "sonner";
import type { VoteSerialized } from "./types";

interface VoteCardProps {
  vote: VoteSerialized;
}

const TOPIC_LABELS: Record<string, string> = {
  DATES: "Dates",
  DESTINATION: "Destination",
  ACTIVITY: "Activity",
  BUDGET: "Budget",
  ACCOMMODATION: "Accommodation",
  OTHER: "Other",
};

export function VoteCard({ vote }: VoteCardProps) {
  const { canManage, canEdit } = useTripContext();
  const [pending, setPending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const totalVoters = useMemo(() => {
    const set = new Set<string>();
    for (const o of vote.options) {
      for (const v of o.voters) set.add(v.id);
    }
    return set.size;
  }, [vote]);

  const totalResponses = useMemo(
    () => vote.options.reduce((sum, o) => sum + o.voters.length, 0),
    [vote],
  );

  const maxVotes = useMemo(
    () => Math.max(0, ...vote.options.map((o) => o.voters.length)),
    [vote],
  );

  const isClosed = vote.status !== "OPEN";
  const isExpired = !!vote.deadline && new Date(vote.deadline) < new Date();
  const locked = isClosed || isExpired;

  async function toggleOption(optionId: string) {
    if (locked || pending || !canEdit) return;
    setPending(true);

    const currentlyVoted = vote.options
      .filter((o) => o.myVote)
      .map((o) => o.id);

    let next: string[];
    if (vote.allowMultiple) {
      next = currentlyVoted.includes(optionId)
        ? currentlyVoted.filter((id) => id !== optionId)
        : [...currentlyVoted, optionId];
    } else {
      next = currentlyVoted.includes(optionId) ? [] : [optionId];
    }

    try {
      await castVote(vote.id, next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your vote. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleClose() {
    setMenuOpen(false);
    try {
      await closeVote(vote.id);
      toast.success("Vote closed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not close this vote. Please try again.");
    }
  }

  async function handleDelete() {
    try {
      await deleteVote(vote.id);
      toast.success("Vote deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete this vote. Please try again.");
    }
  }

  return (
    <>
      <div className="app-surface app-hover-lift rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
                {TOPIC_LABELS[vote.topicType]}
              </span>
              {vote.allowMultiple && (
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Multiple choice
                </span>
              )}
              {locked && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  <Lock className="w-2.5 h-2.5" /> Closed
                </span>
              )}
            </div>
            <h3 className="font-semibold text-base truncate">{vote.title}</h3>
            {vote.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {vote.description}
              </p>
            )}
            {vote.deadline && !locked && (
              <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(vote.deadline) > new Date()
                  ? `Closes ${formatDate(vote.deadline)}`
                  : "Deadline passed"}
              </p>
            )}
          </div>
          {canManage && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Vote options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-xl shadow-lg py-1 z-20">
                    {!isClosed && (
                      <button
                        onClick={handleClose}
                        className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5" /> Close vote
                      </button>
                    )}
                    <button
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
          )}
        </div>

        <div className="space-y-2">
          {vote.options.map((option) => {
            const votes = option.voters.length;
            const pct = totalResponses > 0 ? (votes / totalResponses) * 100 : 0;
            const isWinner = locked && votes > 0 && votes === maxVotes;

            return (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                disabled={locked || pending || !canEdit}
                className={cn(
                  "relative w-full text-left px-3 py-2.5 rounded-xl border transition-all",
                  option.myVote
                    ? "border-primary/60 bg-primary/5 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.08)]"
                    : "border-border hover:border-border/80",
                  locked && "cursor-default",
                  !locked && !pending && "hover:bg-muted/40",
                )}
              >
                <VoteResultBar
                  percentage={pct}
                  isWinner={isWinner}
                  myVote={option.myVote}
                />
                <div className="relative flex items-center gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      option.myVote
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {option.myVote && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {option.label}
                    </p>
                    {(option.dateStart || option.dateEnd) && (
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                        <CalendarDays className="w-3 h-3" />
                        {formatDateRange(option.dateStart, option.dateEnd)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!vote.isAnonymous && option.voters.length > 0 && (
                      <AvatarGroup
                        users={option.voters.map((v) => ({
                          id: v.id,
                          name: v.name,
                          avatarUrl: v.avatarUrl,
                        }))}
                        size="xs"
                        maxVisible={3}
                      />
                    )}
                    <span className="text-xs font-semibold tabular-nums min-w-[2.5rem] text-right">
                      {votes} ({Math.round(pct)}%)
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/60">
          <span>
            {totalVoters} voter{totalVoters !== 1 ? "s" : ""}
          </span>
          <span>{vote.isAnonymous ? "Anonymous" : "Visible votes"}</span>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${vote.title}"?`}
        description="The poll and all responses will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </>
  );
}
