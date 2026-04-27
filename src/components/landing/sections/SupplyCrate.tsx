"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useState } from "react";
import { Backpack, Check, Compass, Droplet, Flame, Tent, Utensils } from "lucide-react";
import { LANDING_SECTION_VIEWPORT } from "../landing-viewport";

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
  const rotateY = useSpring(useTransform(x, [-220, 220], [-15, 15]), {
    stiffness: 130,
    damping: 16,
  });
  const rotateX = useSpring(useTransform(y, [-220, 220], [10, -10]), {
    stiffness: 130,
    damping: 16,
  });

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (
      e.target instanceof Element &&
      e.target.closest(".landing-crate-item")
    ) {
      reset();
      return;
    }

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
    <motion.section
      className="landing-journey-chapter max-w-6xl"
      initial={{ opacity: 0, y: 64 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={LANDING_SECTION_VIEWPORT}
      transition={{ type: "spring", stiffness: 78, damping: 22 }}
    >
      <div className="mb-12 text-center">
        <p className="landing-kicker mb-5">Chapter 03 - The Crate</p>
        <h2 className="text-balance font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
          Who&apos;s bringing <span className="gradient-text">what?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Tap an item to pack it. The shared supply list tracks owners, progress, and the
          packed pile in one place.
        </p>
      </div>

      <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
        <div
          className="landing-crate-stage relative mx-auto h-[28rem] w-full max-w-md overflow-visible"
          onPointerMove={handleMove}
          onPointerLeave={reset}
        >
          <motion.div
            style={{ rotateX, rotateY, transformPerspective: 1200 }}
            className="landing-crate relative h-full w-full"
          >
            <div className="landing-crate-face flex flex-col p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Backpack className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Trip Crate
                    </p>
                    <p className="truncate text-sm font-semibold">Sierra Loop &middot; 5 days</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary">
                  {packed.size}/{INITIAL.length}
                </span>
              </div>

              <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-success"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              <ul className="space-y-2">
                {INITIAL.map((item) => {
                  const isPacked = packed.has(item.id);
                  return (
                    <li key={item.id}>
                      <motion.button
                        type="button"
                        onClick={() => toggle(item.id)}
                        whileTap={{ scale: 0.985 }}
                        aria-pressed={isPacked}
                        className={`landing-crate-item flex min-h-11 w-full items-center gap-3 rounded-xl p-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                          isPacked ? "bg-primary/10" : ""
                        }`}
                      >
                        <motion.span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isPacked
                              ? "bg-success text-success-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                          animate={{
                            rotate: isPacked ? 360 : 0,
                            scale: isPacked ? 1.04 : 1,
                          }}
                          transition={{ type: "spring", stiffness: 180, damping: 18 }}
                        >
                          {isPacked ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <item.Icon className="h-4 w-4" />
                          )}
                        </motion.span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm font-medium ${
                              isPacked ? "text-muted-foreground line-through" : ""
                            }`}
                          >
                            {item.label}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {item.assignee}
                        </span>
                      </motion.button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        </div>

        <div className="space-y-5">
          <h3 className="font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
            Pack like a crew, not a committee.
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              "Assign owners before the trip starts",
              "Track quantities and split shared costs later",
              "See progress update across every device",
              "Reuse the same checklist on the next route",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs italic text-muted-foreground">
            Hover the crate to inspect it. Click items to pack them.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
