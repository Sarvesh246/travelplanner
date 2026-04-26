"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState } from "react";
import { Backpack, Check, Flame, Tent, Utensils, Compass, Droplet } from "lucide-react";

type Item = { id: string; label: string; assignee: string; Icon: typeof Backpack };

const INITIAL: Item[] = [
  { id: "tent", label: "4-person tent", assignee: "Alex", Icon: Tent },
  { id: "stove", label: "Camp stove", assignee: "Mira", Icon: Flame },
  { id: "food", label: "3 days food", assignee: "Jules", Icon: Utensils },
  { id: "water", label: "Water filter", assignee: "Sam", Icon: Droplet },
  { id: "nav", label: "Map & compass", assignee: "Leo", Icon: Compass },
  { id: "pack", label: "Group first-aid", assignee: "Kira", Icon: Backpack },
];

export function SupplyCrate() {
  const [packed, setPacked] = useState<Set<string>>(new Set());

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateY = useSpring(useTransform(x, [-200, 200], [-18, 18]), {
    stiffness: 120,
    damping: 14,
  });
  const rotateX = useSpring(useTransform(y, [-200, 200], [12, -12]), {
    stiffness: 120,
    damping: 14,
  });

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }
  function reset() {
    x.set(0);
    y.set(0);
  }

  function toggle(id: string) {
    setPacked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const progress = (packed.size / INITIAL.length) * 100;

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-32 sm:px-6">
      <div className="mb-12 text-center">
        <p className="landing-kicker mb-5">Chapter 03 — The Crate</p>
        <h2 className="text-balance font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
          Who&apos;s bringing <span className="gradient-text">what?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Tap an item to pack it. Move your mouse over the crate — Beacon&apos;s shared supply
          tracker keeps the whole crew on the same page.
        </p>
      </div>

      <div className="grid items-center gap-12 lg:grid-cols-2">
        {/* 3D Crate */}
        <div
          className="landing-crate-stage relative mx-auto h-80 w-full max-w-md"
          onMouseMove={handleMove}
          onMouseLeave={reset}
        >
          <motion.div
            style={{ rotateX, rotateY, transformPerspective: 1200 }}
            className="landing-crate relative h-full w-full"
          >
            <div className="landing-crate-face flex flex-col p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Backpack className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Trip Crate
                    </p>
                    <p className="text-sm font-semibold">Sierra Loop · 5 days</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-primary">
                  {packed.size}/{INITIAL.length}
                </span>
              </div>

              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-success"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                />
              </div>

              <ul className="flex-1 space-y-1.5 overflow-hidden">
                {INITIAL.map((item) => {
                  const isPacked = packed.has(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-muted/60"
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                            isPacked
                              ? "bg-success text-success-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isPacked ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <item.Icon className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <span className="flex-1 text-sm">
                          <span
                            className={`font-medium transition-colors ${
                              isPacked ? "text-muted-foreground line-through" : ""
                            }`}
                          >
                            {item.label}
                          </span>
                        </span>
                        <span className="text-[11px] text-muted-foreground">{item.assignee}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Copy */}
        <div className="space-y-5">
          <h3 className="font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
            Pack like a crew, not a committee.
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              "Assign owners — no more 'who has the stove?' texts",
              "Track quantities and split costs in one place",
              "Real-time progress across every device",
              "Templates remember last trip's checklist",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs italic text-muted-foreground">
            Move your cursor over the crate ↗
          </p>
        </div>
      </div>
    </section>
  );
}
