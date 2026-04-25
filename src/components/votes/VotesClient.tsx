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

interface VotesClientProps {
  tripId: string;
  votes: VoteSerialized[];
}

export function VotesClient({ tripId, votes }: VotesClientProps) {
  const { canEdit } = useTripContext();
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = votes.filter((v) =>
    tab === "open" ? v.status === "OPEN" : v.status === "CLOSED" || v.status === "CANCELLED"
  );

  return (
    <>
      <PageHeader
        title="Votes"
        description="Gather opinions and reach decisions as a group"
        actions={
          canEdit && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Poll
            </button>
          )
        }
      />

      <div className="mb-5 flex w-full max-w-md gap-1 rounded-xl bg-muted/60 p-1 min-[480px]:w-fit min-[480px]:max-w-none">
        {(["open", "closed"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative min-h-10 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-[480px]:min-h-0 min-[480px]:flex-none min-[480px]:px-4 min-[480px]:py-1.5 ${
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
            <span className="relative">{t === "open" ? "Open" : "Closed"}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<VoteIcon className="w-7 h-7" />}
          title={tab === "open" ? "No active polls" : "No closed polls yet"}
          description={tab === "open" ? "Create a poll to decide dates, destinations, or activities." : "Closed polls will show up here."}
          action={
            tab === "open" && (
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-2 flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
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
