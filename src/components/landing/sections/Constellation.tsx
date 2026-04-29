"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { usePointerTilt } from "../hooks/usePointerTilt";

type Star = {
  id: string;
  x: number;
  y: number;
  name: string;
  role: string;
  quote: string;
};

const STARS: Star[] = [
  {
    id: "a",
    x: 18,
    y: 30,
    name: "Ana",
    role: "PCT thru-hiker",
    quote: "Replaced four group chats and a spreadsheet on day one.",
  },
  {
    id: "b",
    x: 38,
    y: 18,
    name: "Marcus",
    role: "Patagonia trip lead",
    quote: "Splits and supplies in one place. The crew finally stopped arguing.",
  },
  {
    id: "c",
    x: 56,
    y: 36,
    name: "Yuki",
    role: "Climbing club president",
    quote: "Date voting made the whole group say yes faster.",
  },
  {
    id: "d",
    x: 74,
    y: 22,
    name: "Priya",
    role: "Iceland ring planner",
    quote: "Beacon kept every booking, stop, and decision easy to find.",
  },
  {
    id: "e",
    x: 82,
    y: 50,
    name: "Owen",
    role: "Weekend backpacker",
    quote: "Quick enough for weekend plans, organized enough for big routes.",
  },
  {
    id: "f",
    x: 30,
    y: 60,
    name: "Sasha",
    role: "Six-trip organizer",
    quote: "Updates felt instant, even with six people changing plans.",
  },
  {
    id: "g",
    x: 58,
    y: 70,
    name: "Rae",
    role: "Dolomites co-lead",
    quote: "New crew members joined from one invite and caught up fast.",
  },
];

const LINES: [string, string][] = [
  ["a", "b"],
  ["b", "c"],
  ["c", "d"],
  ["a", "f"],
  ["c", "g"],
  ["d", "e"],
  ["e", "g"],
  ["f", "g"],
];

const DUST = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  x: (i * 29) % 100,
  y: (i * 47) % 100,
  opacity: 0.18 + (i % 5) * 0.08,
}));

export function Constellation() {
  const [active, setActive] = useState<Star>(STARS[0]);
  const draggingRef = useRef(false);
  const { primePointerTarget, reset, rotateX, rotateY, schedulePointerMove } =
    usePointerTilt({
      bounds: {
        x: [2, -2],
        y: [-14, 14],
      },
      inputRange: {
        x: 320,
        y: 320,
      },
      resolveOffset: ({ bounds, clientX }) => {
        const offset = clientX - bounds.left - bounds.width / 2;
        const effectiveOffset = draggingRef.current ? offset : offset * 0.35;
        return {
          x: effectiveOffset,
          y: effectiveOffset,
        };
      },
    });

  function byId(id: string) {
    return STARS.find((star) => star.id === id)!;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    schedulePointerMove(event);
  }

  return (
    <motion.section
      className="landing-journey-chapter max-w-6xl"
    >
      <div className="mb-12 text-center">
        <p className="landing-kicker mb-5">Chapter 06 - The Crew</p>
        <h2 className="text-balance font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
          Crews already <span className="gradient-text">on the trail</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Hover or focus a star to hear from a crew. Drag the sky side-to-side to tilt it.
        </p>
      </div>

      <div
        className="landing-glass landing-constellation relative h-[30rem] cursor-grab overflow-hidden rounded-3xl active:cursor-grabbing"
        onPointerDown={(event) => {
          draggingRef.current = true;
          primePointerTarget(event.currentTarget);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerEnter={(event) => {
          primePointerTarget(event.currentTarget);
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => {
          draggingRef.current = false;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerLeave={() => {
          draggingRef.current = false;
          reset();
        }}
      >
        <motion.div
          style={{ rotateY, rotateX, transformPerspective: 1400 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />

          {DUST.map((dot) => (
            <span
              key={dot.id}
              className="absolute h-1 w-1 rounded-full bg-foreground"
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                opacity: dot.opacity,
              }}
            />
          ))}

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
                  stroke="hsl(var(--primary) / 0.32)"
                  strokeWidth="1.2"
                />
              );
            })}
          </svg>

          {STARS.map((star) => (
            <button
              key={star.id}
              type="button"
              onMouseEnter={() => setActive(star)}
              onFocus={() => setActive(star)}
              onClick={() => setActive(star)}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ left: `${star.x}%`, top: `${star.y}%` }}
              aria-label={`${star.name} - ${star.role}`}
            >
              <span
                className={`relative block h-4 w-4 rounded-full bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.65)] transition-transform ${
                  active.id === star.id ? "scale-150" : ""
                }`}
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
              </span>
              <span className="pointer-events-none mt-1 block whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                {star.name}
              </span>
            </button>
          ))}

        </motion.div>

        <motion.div
          key={active.id}
          initial={{ opacity: 0, x: "-50%", y: 10 }}
          animate={{ opacity: 1, x: "-50%", y: 0 }}
          className="landing-glass absolute bottom-5 left-1/2 z-20 w-[86%] max-w-md rounded-2xl p-4 sm:bottom-6 sm:p-5"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary sm:text-[11px]">
            {active.name} - {active.role}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-foreground sm:text-sm">
            &quot;{active.quote}&quot;
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}
