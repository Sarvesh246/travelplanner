"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { MapPin } from "lucide-react";

type Peak = { id: string; name: string; subtitle: string; baseVotes: number };

const PEAKS: Peak[] = [
  { id: "alps", name: "Dolomites", subtitle: "Italy · 7 days", baseVotes: 4 },
  { id: "patagonia", name: "Patagonia", subtitle: "Chile · 10 days", baseVotes: 6 },
  { id: "iceland", name: "Iceland Ring", subtitle: "Iceland · 8 days", baseVotes: 3 },
];

export function VoteMountain() {
  const [votes, setVotes] = useState<Record<string, number>>(
    Object.fromEntries(PEAKS.map((p) => [p.id, p.baseVotes]))
  );
  const [planted, setPlanted] = useState<Record<string, number>>({});

  const max = Math.max(...Object.values(votes), 1);

  function castVote(id: string) {
    setVotes((v) => ({ ...v, [id]: v[id] + 1 }));
    setPlanted((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));
  }

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-32 sm:px-6">
      <div className="mb-12 text-center">
        <p className="landing-kicker mb-5">Chapter 05 — The Vote</p>
        <h2 className="text-balance font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
          Where to <span className="gradient-text">next?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Every crew has a deciding vote. Tap a peak — plant your flag — and watch the
          mountain grow.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {PEAKS.map((peak) => {
          const v = votes[peak.id];
          const heightPct = (v / max) * 100;
          const flags = planted[peak.id] || 0;

          return (
            <button
              key={peak.id}
              type="button"
              onClick={() => castVote(peak.id)}
              className="landing-glass group relative flex h-80 flex-col items-center justify-end overflow-hidden rounded-3xl p-5 text-left transition-transform hover:-translate-y-1"
            >
              {/* Mountain shape */}
              <motion.div
                className="absolute inset-x-0 bottom-0 origin-bottom"
                initial={false}
                animate={{ height: `${30 + heightPct * 0.55}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              >
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="h-full w-full"
                  aria-hidden
                >
                  <defs>
                    <linearGradient id={`peak-${peak.id}`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary) / 0.9)" />
                      <stop offset="100%" stopColor="hsl(var(--primary) / 0.4)" />
                    </linearGradient>
                  </defs>
                  <polygon points="0,100 50,0 100,100" fill={`url(#peak-${peak.id})`} />
                  <polygon
                    points="50,0 65,30 50,28 35,30"
                    fill="hsl(var(--background) / 0.8)"
                  />
                </svg>
              </motion.div>

              {/* Flags */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2">
                <AnimatePresence>
                  {Array.from({ length: Math.min(flags, 5) }).map((_, i) => (
                    <span
                      key={`${peak.id}-flag-${i}`}
                      className="landing-flag absolute"
                      style={{
                        left: `${(i - 2) * 14}px`,
                        top: `${-i * 4}px`,
                      }}
                    >
                      <svg width="20" height="28" viewBox="0 0 20 28" aria-hidden>
                        <line x1="2" y1="0" x2="2" y2="28" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
                        <polygon points="2,2 16,7 2,12" fill="hsl(var(--primary))" />
                      </svg>
                    </span>
                  ))}
                </AnimatePresence>
              </div>

              {/* Card content */}
              <div className="relative z-20 w-full landing-glass rounded-xl p-3 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {peak.subtitle}
                    </div>
                    <p className="mt-0.5 text-base font-bold tracking-tight">{peak.name}</p>
                  </div>
                  <motion.span
                    key={v}
                    initial={{ scale: 1.4, color: "hsl(var(--primary))" }}
                    animate={{ scale: 1 }}
                    className="font-sans text-2xl font-bold text-primary"
                  >
                    {v}
                  </motion.span>
                </div>
              </div>

              <span className="absolute bottom-3 right-4 text-[10px] font-medium uppercase tracking-wider text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Tap to vote ↑
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
