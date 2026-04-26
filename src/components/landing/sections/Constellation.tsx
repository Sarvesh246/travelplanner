"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";

type Star = {
  id: string;
  x: number;
  y: number;
  name: string;
  role: string;
  quote: string;
};

const STARS: Star[] = [
  { id: "a", x: 18, y: 30, name: "Ana", role: "PCT thru-hiker", quote: "Replaced 4 group chats and a Google Doc on day one." },
  { id: "b", x: 38, y: 18, name: "Marcus", role: "Trip lead, Patagonia '25", quote: "Splits + supplies in one place. Crew finally stopped arguing." },
  { id: "c", x: 56, y: 36, name: "Yuki", role: "Climbing club president", quote: "Voting on dates is the killer feature for big groups." },
  { id: "d", x: 74, y: 22, name: "Priya", role: "Iceland ring, 12 ppl", quote: "Beacon scaled with us. Logistics were a non-issue." },
  { id: "e", x: 82, y: 50, name: "Owen", role: "Weekend backpacker", quote: "Lighter than a planner, snappier than a notes app." },
  { id: "f", x: 30, y: 60, name: "Sasha", role: "Organized 6 trips", quote: "The optimistic UI feels like the future of group apps." },
  { id: "g", x: 58, y: 70, name: "Rae", role: "Co-led Dolomites", quote: "Onboarding new crew is just an invite link." },
];

const LINES: [string, string][] = [
  ["a", "b"], ["b", "c"], ["c", "d"], ["a", "f"],
  ["c", "g"], ["d", "e"], ["e", "g"], ["f", "g"],
];

export function Constellation() {
  const [active, setActive] = useState<Star | null>(null);
  const tilt = useMotionValue(0);
  const rotateY = useTransform(tilt, [-300, 300], [-12, 12]);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    tilt.set(e.clientX - rect.left - rect.width / 2);
  }
  function reset() {
    tilt.set(0);
  }

  const byId = (id: string) => STARS.find((s) => s.id === id)!;

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-32 sm:px-6">
      <div className="mb-12 text-center">
        <p className="landing-kicker mb-5">Chapter 06 — The Crew</p>
        <h2 className="text-balance font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
          Crews already <span className="gradient-text">on the trail</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Hover a star to hear from a real crew. Drag your cursor side-to-side to tilt the
          night sky.
        </p>
      </div>

      <div
        className="landing-glass landing-constellation relative h-[28rem] overflow-hidden rounded-3xl"
        onMouseMove={handleMove}
        onMouseLeave={() => {
          reset();
          setActive(null);
        }}
      >
        <motion.div
          style={{ rotateY, transformPerspective: 1400 }}
          className="absolute inset-0"
        >
          {/* Background gradient + dust */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />

          {/* Lines */}
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            {LINES.map(([a, b], i) => {
              const A = byId(a);
              const B = byId(b);
              return (
                <line
                  key={i}
                  x1={`${A.x}%`}
                  y1={`${A.y}%`}
                  x2={`${B.x}%`}
                  y2={`${B.y}%`}
                  stroke="hsl(var(--primary) / 0.3)"
                  strokeWidth="1"
                />
              );
            })}
          </svg>

          {/* Stars */}
          {STARS.map((star) => (
            <button
              key={star.id}
              type="button"
              onMouseEnter={() => setActive(star)}
              onFocus={() => setActive(star)}
              onClick={() => setActive(star)}
              className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
              style={{ left: `${star.x}%`, top: `${star.y}%` }}
              aria-label={`${star.name} — ${star.role}`}
            >
              <span
                className={`relative block h-3 w-3 rounded-full bg-primary transition-all ${
                  active?.id === star.id ? "scale-150" : ""
                }`}
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
              </span>
              <span className="pointer-events-none mt-1 block whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                {star.name}
              </span>
            </button>
          ))}

          {/* Quote card */}
          {active && (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="landing-glass absolute bottom-6 left-1/2 w-[88%] max-w-md -translate-x-1/2 rounded-2xl p-5"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                {active.name} · {active.role}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                &ldquo;{active.quote}&rdquo;
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
