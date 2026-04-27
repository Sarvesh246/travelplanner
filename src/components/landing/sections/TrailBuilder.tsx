"use client";

import {
  AnimatePresence,
  motion,
  Reorder,
  useTransform,
} from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { useCoarsePointer } from "../hooks/useIsMobile";
import { usePointerTilt } from "../hooks/usePointerTilt";
import { MapPin, Mountain, Tent, Trees, Waves } from "lucide-react";
import { useElementScrollProgress } from "../hooks/useElementScrollProgress";
import { useMotionEnabled } from "../hooks/useIsMobile";
import { useLandingMotionRuntime } from "../hooks/useLandingMotionRuntime";

type Stop = {
  id: string;
  name: string;
  day: string;
  time: string;
  miles: number;
  Icon: typeof MapPin;
  hue: string;
};

const INITIAL: Stop[] = [
  {
    id: "trailhead",
    name: "Trailhead",
    day: "Day 1",
    time: "8:00 AM meet-up",
    miles: 0,
    Icon: MapPin,
    hue: "163 33% 33%",
  },
  {
    id: "lake",
    name: "Mirror Lake",
    day: "Day 2",
    time: "2:30 PM swim stop",
    miles: 7,
    Icon: Waves,
    hue: "200 45% 45%",
  },
  {
    id: "ridge",
    name: "Pine Ridge",
    day: "Day 3",
    time: "11:15 AM lunch",
    miles: 14,
    Icon: Trees,
    hue: "131 35% 38%",
  },
  {
    id: "summit",
    name: "Summit Camp",
    day: "Day 4",
    time: "5:45 PM sunset",
    miles: 22,
    Icon: Mountain,
    hue: "39 45% 50%",
  },
  {
    id: "basecamp",
    name: "Basecamp",
    day: "Day 5",
    time: "10:00 AM shuttle",
    miles: 28,
    Icon: Tent,
    hue: "12 55% 50%",
  },
];

function routeMiles(stops: Stop[]) {
  return stops.slice(1).reduce((sum, stop, index) => {
    return sum + Math.abs(stop.miles - stops[index].miles);
  }, 0);
}

function StopCard({
  active,
  index,
  moveStop,
  setActive,
  stop,
  total,
}: {
  active: boolean;
  index: number;
  moveStop: (id: string, direction: -1 | 1) => void;
  setActive: (stop: Stop | null) => void;
  stop: Stop;
  total: number;
}) {
  const coarsePointer = useCoarsePointer();
  const motionEnabled = useMotionEnabled();
  const runtime = useLandingMotionRuntime();
  const enableTilt =
    motionEnabled && !coarsePointer && runtime.qualityTier === "full";
  const { primePointerTarget, reset, rotateX, rotateY, schedulePointerMove } =
    usePointerTilt({
      bounds: {
        x: [8, -8],
        y: [-10, 10],
      },
      inputRange: {
        x: 60,
        y: 60,
      },
    });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!enableTilt) return;
    schedulePointerMove(e);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveStop(stop.id, -1);
    }
    if (
      event.key === "ArrowRight" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      moveStop(stop.id, 1);
    }
  }

  return (
    <Reorder.Item
      value={stop}
      layout
      whileDrag={{ scale: 1.05, zIndex: 50 }}
      style={{ touchAction: "none" }}
      className="relative cursor-grab active:cursor-grabbing"
    >
      <motion.div
        role="button"
        tabIndex={0}
        aria-label={`${stop.day}, ${stop.name}. Press Enter or Space to move this stop later in the route.`}
        onFocus={() => setActive(stop)}
        onBlur={() => setActive(null)}
        onKeyDown={handleKeyDown}
        onMouseEnter={(event) => {
          if (enableTilt) {
            primePointerTarget(event.currentTarget);
          }
          setActive(stop);
        }}
        onMouseLeave={() => {
          setActive(null);
          if (enableTilt) {
            reset();
          }
        }}
        onMouseMove={handleMouseMove}
        style={
          enableTilt
            ? { rotateX, rotateY, transformPerspective: 850 }
            : undefined
        }
        className="landing-tilt landing-glass relative w-44 rounded-2xl p-4 outline-none ring-primary/0 transition-shadow focus-visible:ring-2"
      >
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              className="landing-glass pointer-events-none absolute -top-12 left-1/2 z-20 w-max -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-medium text-foreground"
            >
              {stop.time}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="landing-tilt-inner">
          <div
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `hsl(${stop.hue} / 0.15)`,
              color: `hsl(${stop.hue})`,
            }}
          >
            <stop.Icon className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {stop.day}
          </p>
          <h4 className="mt-0.5 text-sm font-semibold tracking-tight">
            {stop.name}
          </h4>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Stop {index + 1} of {total} &middot; {stop.miles} mi
          </p>
        </div>
      </motion.div>
    </Reorder.Item>
  );
}

export function TrailBuilder() {
  const ref = useRef<HTMLElement>(null);
  const motionEnabled = useMotionEnabled();
  const [stops, setStops] = useState(INITIAL);
  const [active, setActive] = useState<Stop | null>(INITIAL[0]);
  const total = useMemo(() => routeMiles(stops), [stops]);
  const scrollYProgress = useElementScrollProgress(ref, 0.75, 0.45);
  const trailProgress = useTransform(scrollYProgress, [0.12, 0.72], [0, 1]);

  function moveStop(id: string, direction: -1 | 1) {
    setStops((current) => {
      const index = current.findIndex((stop) => stop.id === id);
      const nextIndex = Math.min(
        current.length - 1,
        Math.max(0, index + direction),
      );
      if (index < 0 || index === nextIndex) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  return (
    <motion.section
      id="trail"
      ref={ref}
      className="landing-trail-section landing-journey-chapter landing-journey-chapter--after-range max-w-6xl flex flex-col"
    >
      <div className="landing-trail-heading mb-12 text-center">
        <p className="landing-kicker mb-5">Chapter 02 - The Trail</p>
        <h2 className="text-balance font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
          Drag the stops.{" "}
          <span className="gradient-text">Reroute the journey.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Reorder the itinerary, hover for timing, and the route distance
          recomputes as the crew changes course.
        </p>
      </div>

      <div className="landing-glass relative overflow-visible rounded-3xl p-6 sm:p-10">
        <svg
          className="pointer-events-none absolute inset-x-6 top-1/2 hidden -translate-y-1/2 lg:block"
          height="90"
          style={{ width: "calc(100% - 3rem)" }}
          viewBox="0 0 100 90"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 45 C 14 15, 24 75, 36 45 S 58 20, 70 45 S 92 75, 100 45"
            fill="none"
            stroke="hsl(var(--primary) / 0.18)"
            strokeWidth="3"
            strokeLinecap="round"
            className="landing-trail-path"
          />
          <motion.path
            d="M0 45 C 14 15, 24 75, 36 45 S 58 20, 70 45 S 92 75, 100 45"
            fill="none"
            stroke="hsl(var(--primary) / 0.72)"
            strokeWidth="4"
            strokeLinecap="round"
            className="landing-trail-progress"
            style={{ pathLength: motionEnabled ? trailProgress : 1 }}
          />
        </svg>

        <Reorder.Group
          axis="x"
          values={stops}
          onReorder={setStops}
          className="relative flex flex-wrap justify-center gap-4 lg:flex-nowrap lg:justify-between"
        >
          {stops.map((stop, index) => (
            <StopCard
              key={stop.id}
              active={active?.id === stop.id}
              index={index}
              moveStop={moveStop}
              setActive={setActive}
              stop={stop}
              total={stops.length}
            />
          ))}
        </Reorder.Group>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success" />
            Live itinerary &middot; {stops.length} stops &middot; {total} mi
            routed
          </div>
          <div className="text-xs text-muted-foreground">
            Drag horizontally, or focus a stop and press Enter
          </div>
        </div>
      </div>
    </motion.section>
  );
}
