"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Vote as VoteIcon, Plus } from "lucide-react";
import { VoteList } from "./VoteList";
import { CreateVoteDialog } from "./CreateVoteDialog";
import type { VoteSerialized } from "./types";
import { useTripContext } from "@/components/trip/TripContext";

function hasMyResponse(vote: VoteSerialized) {
  return vote.options.some((o) => o.myVote);
}

function isVoteUnanswered(vote: VoteSerialized) {
  return vote.status === "OPEN" && !hasMyResponse(vote);
}

interface VotesClientProps {
  tripId: string;
  votes: VoteSerialized[];
}

export function VotesClient({ tripId, votes }: VotesClientProps) {
  const { canEdit } = useTripContext();
  const [tab, setTab] = useState<"open" | "needs" | "closed">("open");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = votes.filter((v) =>
    tab === "open"
      ? v.status === "OPEN"
      : tab === "needs"
        ? isVoteUnanswered(v)
        : v.status === "CLOSED" || v.status === "CANCELLED"
  );

  return (
    <>
      <PageHeader
        eyebrow="Crew decisions"
        title="Votes"
        description="Gather opinions and reach decisions as a group"
        actions={
          canEdit && votes.length > 0 && (
            <button
              onClick={() => setCreateOpen(true)}
              className="app-hover-lift flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Poll
            </button>
          )
        }
      />

      {votes.length > 0 ? (
      <div className="app-glass mb-5 grid w-full max-w-xl grid-cols-3 gap-1 rounded-xl p-1 min-[560px]:w-fit min-[560px]:max-w-none">
        {(
          [
            ["open", "Open"],
            ["needs", "Unanswered"],
            ["closed", "Closed"],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative flex min-h-11 flex-col justify-center rounded-lg px-1.5 py-2 text-center text-xs font-semibold leading-tight transition-colors min-[560px]:min-h-[2.375rem] min-[560px]:px-4 min-[560px]:text-sm ${
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === t && (
              <motion.div
                layoutId="votes-tab"
                className="absolute inset-0 bg-card shadow-sm rounded-lg"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<VoteIcon className="w-7 h-7" />}
          title={
            tab === "open"
              ? "No active polls"
              : tab === "needs"
                ? "You're all caught up"
                : "No closed polls yet"
          }
          description={
            tab === "open"
              ? "Create a poll to decide dates, destinations, or activities."
              : tab === "needs"
                ? "These are open polls where you haven't recorded a preference yet."
                : "Closed polls will show up here."
          }
          action={
            tab === "open" && (
              <button
                onClick={() => setCreateOpen(true)}
                className="app-hover-lift mt-2 flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create first poll
              </button>
            )
          }
        />
      ) : (
        <VoteList votes={filtered} />
      )}

      <CreateVoteDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        tripId={tripId}
      />
    </>
  );
}
