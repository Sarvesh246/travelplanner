"use client";

import { motion } from "framer-motion";
import { staggerContainer, listItem } from "@/lib/motion";
import { VoteCard } from "./VoteCard";
import type { VoteSerialized } from "./types";

interface VoteListProps {
  votes: VoteSerialized[];
}

export function VoteList({ votes }: VoteListProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid gap-4 md:grid-cols-2"
    >
      {votes.map((vote) => (
        <motion.div key={vote.id} variants={listItem}>
          <VoteCard vote={vote} />
        </motion.div>
      ))}
    </motion.div>
  );
}
