"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoteResultBarProps {
  percentage: number;
  isWinner?: boolean;
  myVote?: boolean;
}

export function VoteResultBar({ percentage, isWinner, myVote }: VoteResultBarProps) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "h-full",
          isWinner
            ? "[background-color:hsl(var(--success)/0.2)]"
            : myVote
              ? "bg-primary/15"
              : "bg-muted-foreground/10"
        )}
      />
    </div>
  );
}
