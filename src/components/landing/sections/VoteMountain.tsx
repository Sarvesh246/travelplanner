"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";

type Peak = { id: string; name: string; subtitle: string; baseVotes: number };

const PEAKS: Peak[] = [
  { id: "alps", name: "Dolomites", subtitle: "Italy - 7 days", baseVotes: 4 },
  {
    id: "patagonia",
    name: "Patagonia",
    subtitle: "Chile - 10 days",
    baseVotes: 6,
  },
  {
    id: "iceland",
    name: "Iceland Ring",
    subtitle: "Iceland - 8 days",
    baseVotes: 3,
  },
];

const NEEDLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  angle: (i / 18) * Math.PI * 2,
  distance: 34 + (i % 5) * 9,
  rotate: i * 23,
}));

export function VoteMountain() {
  const [votes, setVotes] = useState<Record<string, number>>(
    Object.fromEntries(PEAKS.map((p) => [p.id, p.baseVotes])),
  );
  const [planted, setPlanted] = useState<Record<string, number>>({});
  const [burst, setBurst] = useState<{ id: number; peakId: string } | null>(
    null,
  );
  const [lastVoted, setLastVoted] = useState<string | null>(null);
  const burstCounter = useRef(0);
  const pointerVoteHandled = useRef(false);
  const max = Math.max(...Object.values(votes), 1);

  const leaderboard = useMemo(
    () => [...PEAKS].sort((a, b) => votes[b.id] - votes[a.id]),
    [votes],
  );

  function castVote(id: string) {
    setVotes((current) => ({ ...current, [id]: current[id] + 1 }));
    setPlanted((current) => ({ ...current, [id]: (current[id] || 0) + 1 }));
    setLastVoted(id);

    burstCounter.current += 1;
    const burstId = burstCounter.current;
    setBurst({ id: burstId, peakId: id });
    window.setTimeout(() => {
      setBurst((current) => (current?.id === burstId ? null : current));
    }, 900);
  }

  function castPointerVote(id: string, pointerType: string) {
    if (pointerType === "touch") return;

    pointerVoteHandled.current = true;
    castVote(id);
  }

  function castKeyboardVote(id: string) {
    if (pointerVoteHandled.current) {
      pointerVoteHandled.current = false;
      return;
    }

    castVote(id);
  }

  return (
    <motion.section
      className="landing-journey-chapter max-w-6xl"
    >
      <div className="mb-12 text-center">
        <p className="landing-kicker mb-5">Chapter 05 - The Vote</p>
        <h2 className="text-balance font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
          Where to <span className="gradient-text">next?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Tap a peak to cast a vote, plant a flag, and watch the mountain grow.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {PEAKS.map((peak) => {
          const voteCount = votes[peak.id];
          const heightPct = (voteCount / max) * 100;
          const mountainHeight = 34 + heightPct * 0.52;
          const flags = planted[peak.id] || 0;
          const selected = lastVoted === peak.id;

          return (
            <motion.button
              key={peak.id}
              type="button"
              onPointerDown={(event) =>
                castPointerVote(peak.id, event.pointerType)
              }
              onClick={() => castKeyboardVote(peak.id)}
              whileTap={{ scale: 0.985 }}
              className={`landing-glass group relative flex h-80 flex-col items-center justify-end overflow-hidden rounded-3xl p-5 text-left outline-none transition-[transform,box-shadow] duration-700 hover:-translate-y-1 hover:shadow-[0_0_0_1.5px_hsl(var(--primary)/0.45),0_14px_48px_hsl(var(--primary)/0.24),0_0_72px_hsl(var(--primary)/0.35)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-[0_0_0_1.5px_hsl(var(--primary)/0.45),0_14px_48px_hsl(var(--primary)/0.24),0_0_72px_hsl(var(--primary)/0.35)] ${
                selected ? "ring-2 ring-primary/45" : ""
              }`}
              style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
              initial={false}
              animate={{ scale: selected ? 1.012 : 1 }}
              transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="absolute inset-x-0 bottom-0 origin-bottom"
                initial={false}
                animate={{ height: `${mountainHeight}%` }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="h-full w-full"
                  aria-hidden
                >
                  <defs>
                    <linearGradient
                      id={`peak-${peak.id}`}
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(var(--primary) / 0.92)"
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(var(--secondary) / 0.42)"
                      />
                    </linearGradient>
                  </defs>
                  <polygon
                    points="0,100 50,0 100,100"
                    fill={`url(#peak-${peak.id})`}
                  />
                  <polygon
                    points="50,0 65,30 50,28 35,30"
                    fill="hsl(var(--background) / 0.82)"
                  />
                </svg>
              </motion.div>

              <div
                className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
                style={{ bottom: `${Math.max(28, mountainHeight - 4)}%` }}
              >
                <AnimatePresence>
                  {Array.from({ length: Math.min(flags, 4) }).map((_, i) => (
                    <span
                      key={`${peak.id}-flag-${i}`}
                      className="landing-flag absolute"
                      style={{ left: `${(i - 2) * 12}px`, top: `${-i * 5}px` }}
                    >
                      <svg
                        width="20"
                        height="28"
                        viewBox="0 0 20 28"
                        aria-hidden
                      >
                        <line
                          x1="2"
                          y1="0"
                          x2="2"
                          y2="28"
                          stroke="hsl(var(--foreground))"
                          strokeWidth="1.5"
                        />
                        <polygon
                          points="2,2 16,7 2,12"
                          fill="hsl(var(--primary))"
                        />
                      </svg>
                    </span>
                  ))}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {burst?.peakId === peak.id && (
                  <span className="pointer-events-none absolute left-1/2 top-1/2 z-30">
                    <motion.span
                      key={`${burst.id}-plus`}
                      initial={{ opacity: 0, y: 8, scale: 0.8 }}
                      animate={{ opacity: 1, y: -34, scale: 1 }}
                      exit={{ opacity: 0, y: -48, scale: 0.88 }}
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute -left-5 -top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-lg"
                    >
                      +1
                    </motion.span>
                    {NEEDLES.map((needle) => (
                      <motion.span
                        key={`${burst.id}-${needle.id}`}
                        initial={{
                          opacity: 1,
                          x: 0,
                          y: 0,
                          rotate: needle.rotate,
                          scale: 0.8,
                        }}
                        animate={{
                          opacity: 0,
                          x: Math.cos(needle.angle) * needle.distance,
                          y: Math.sin(needle.angle) * needle.distance,
                          rotate: needle.rotate + 100,
                          scale: 1,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute h-1.5 w-4 rounded-full bg-primary"
                      />
                    ))}
                  </span>
                )}
              </AnimatePresence>

              <div className="landing-glass relative z-20 w-full rounded-xl p-3 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {peak.subtitle}
                    </div>
                    <p className="mt-0.5 truncate text-base font-bold tracking-tight">
                      {peak.name}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <motion.span
                      key={voteCount}
                      initial={{ scale: 1.4, color: "hsl(var(--primary))" }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                      className="block font-sans text-2xl font-bold text-primary"
                    >
                      {voteCount}
                    </motion.span>
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                      Cast vote
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="landing-glass mt-6 grid gap-3 rounded-2xl p-4 sm:grid-cols-3">
        {leaderboard.map((peak, index) => (
          <motion.div
            key={peak.id}
            className="flex items-center justify-between rounded-xl bg-background/30 px-4 py-3 text-sm"
          >
            <span className="font-medium">
              {index + 1}. {peak.name}
            </span>
            <motion.span
              key={votes[peak.id]}
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-semibold text-primary"
            >
              {votes[peak.id]} votes
            </motion.span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
