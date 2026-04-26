"use client";

import { motion, Reorder, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import { MapPin, Mountain, Tent, Trees, Waves } from "lucide-react";

type Stop = {
  id: string;
  name: string;
  day: string;
  miles: number;
  Icon: typeof MapPin;
  hue: string;
};

const INITIAL: Stop[] = [
  { id: "trailhead", name: "Trailhead", day: "Day 1", miles: 0, Icon: MapPin, hue: "163 33% 27%" },
  { id: "lake", name: "Mirror Lake", day: "Day 2", miles: 7, Icon: Waves, hue: "200 45% 45%" },
  { id: "ridge", name: "Pine Ridge", day: "Day 3", miles: 14, Icon: Trees, hue: "131 35% 35%" },
  { id: "summit", name: "Summit Camp", day: "Day 4", miles: 22, Icon: Mountain, hue: "39 45% 50%" },
  { id: "basecamp", name: "Basecamp", day: "Day 5", miles: 28, Icon: Tent, hue: "12 55% 50%" },
];

function StopCard({ stop, index, total }: { stop: Stop; index: number; total: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateY = useTransform(x, [-50, 50], [-12, 12]);
  const rotateX = useTransform(y, [-50, 50], [10, -10]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }
  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <Reorder.Item
      value={stop}
      whileDrag={{ scale: 1.06, zIndex: 50 }}
      style={{ touchAction: "none" }}
      className="cursor-grab active:cursor-grabbing"
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformPerspective: 800 }}
        className="landing-tilt landing-glass relative w-44 rounded-2xl p-4"
      >
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
          <h4 className="mt-0.5 text-sm font-semibold tracking-tight">{stop.name}</h4>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Stop {index + 1} of {total} · {stop.miles} mi
          </p>
        </div>
      </motion.div>
    </Reorder.Item>
  );
}

export function TrailBuilder() {
  const [stops, setStops] = useState(INITIAL);
  const total = stops.reduce((max, s) => Math.max(max, s.miles), 0);

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-32 sm:px-6">
      <div className="mb-12 text-center">
        <p className="landing-kicker mb-5">Chapter 02 — The Trail</p>
        <h2 className="text-balance font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
          Drag the stops. <span className="gradient-text">Reroute the journey.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          A real itinerary in Beacon. Reorder, hover for tilt, and the path stays in sync
          across the whole crew.
        </p>
      </div>

      <div className="relative landing-glass overflow-hidden rounded-3xl p-6 sm:p-10">
        {/* Background trail line */}
        <svg
          className="pointer-events-none absolute inset-x-6 top-1/2 hidden -translate-y-1/2 sm:block"
          height="4"
          width="calc(100% - 3rem)"
          aria-hidden
        >
          <line
            x1="0"
            y1="2"
            x2="100%"
            y2="2"
            stroke="hsl(var(--primary) / 0.4)"
            strokeWidth="2"
            className="landing-trail-path"
          />
        </svg>

        <Reorder.Group
          axis="x"
          values={stops}
          onReorder={setStops}
          className="relative flex flex-wrap justify-center gap-4 sm:flex-nowrap sm:justify-between"
        >
          {stops.map((stop, i) => (
            <StopCard key={stop.id} stop={stop} index={i} total={stops.length} />
          ))}
        </Reorder.Group>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success" />
            Live itinerary · {stops.length} stops · {total} mi total
          </div>
          <div className="text-xs text-muted-foreground">
            Tip: drag horizontally to reorder ↔
          </div>
        </div>
      </div>
    </section>
  );
}
