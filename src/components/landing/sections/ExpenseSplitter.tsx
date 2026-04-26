"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";

const PEOPLE = [
  { id: "alex", name: "Alex", color: "163 33% 35%" },
  { id: "mira", name: "Mira", color: "131 35% 50%" },
  { id: "jules", name: "Jules", color: "39 60% 55%" },
  { id: "sam", name: "Sam", color: "200 45% 50%" },
  { id: "leo", name: "Leo", color: "12 55% 55%" },
];

export function ExpenseSplitter() {
  const [total, setTotal] = useState(420);
  const [included, setIncluded] = useState<Set<string>>(
    new Set(PEOPLE.map((p) => p.id))
  );

  const share = useMemo(() => {
    const n = included.size || 1;
    return total / n;
  }, [total, included]);

  function toggle(id: string) {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else next.add(id);
      return next;
    });
  }

  const maxBar = total;

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-32 sm:px-6">
      <div className="mb-12 text-center">
        <p className="landing-kicker mb-5">Chapter 04 — The Split</p>
        <h2 className="text-balance font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
          Fair splits, <span className="gradient-text">no spreadsheet</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Drag the slider. Tap people in or out. Watch shares animate live — the same way
          Beacon balances real expenses on a trip.
        </p>
      </div>

      <div className="landing-glass rounded-3xl p-6 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Controls */}
          <div>
            <div className="mb-5">
              <label
                htmlFor="trip-cost"
                className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                <span>Trip cost</span>
                <motion.span
                  key={total}
                  initial={{ scale: 0.9, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-sans text-2xl font-bold text-foreground"
                >
                  ${total}
                </motion.span>
              </label>
              <input
                id="trip-cost"
                type="range"
                min="100"
                max="2000"
                step="20"
                value={total}
                onChange={(e) => setTotal(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              />
            </div>

            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Crew ({included.size} in)
            </p>
            <div className="flex flex-wrap gap-2">
              {PEOPLE.map((p) => {
                const on = included.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    className="group relative flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all"
                    style={{
                      borderColor: on
                        ? `hsl(${p.color})`
                        : "hsl(var(--border))",
                      backgroundColor: on
                        ? `hsl(${p.color} / 0.12)`
                        : "transparent",
                      color: on ? `hsl(${p.color})` : "hsl(var(--muted-foreground))",
                    }}
                    aria-pressed={on}
                  >
                    <span
                      className="h-2 w-2 rounded-full transition-transform"
                      style={{
                        backgroundColor: `hsl(${p.color})`,
                        transform: on ? "scale(1.4)" : "scale(1)",
                      }}
                    />
                    {p.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Each person owes
              </p>
              <motion.p
                key={share.toFixed(2)}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mt-1 font-sans text-3xl font-bold text-primary sm:text-4xl"
              >
                ${share.toFixed(2)}
              </motion.p>
            </div>
          </div>

          {/* Bars */}
          <div className="flex h-72 items-end gap-3 sm:gap-4">
            {PEOPLE.map((p) => {
              const on = included.has(p.id);
              const value = on ? share : 0;
              const pct = (value / maxBar) * 100;
              return (
                <div key={p.id} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex h-full w-full items-end overflow-hidden rounded-xl bg-muted/40">
                    <motion.div
                      className="w-full rounded-xl"
                      initial={false}
                      animate={{
                        height: `${pct}%`,
                        opacity: on ? 1 : 0.25,
                      }}
                      transition={{ type: "spring", stiffness: 130, damping: 16 }}
                      style={{
                        background: `linear-gradient(to top, hsl(${p.color}), hsl(${p.color} / 0.55))`,
                        boxShadow: `0 -8px 24px -6px hsl(${p.color} / 0.5)`,
                      }}
                    />
                    {on && (
                      <motion.span
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute inset-x-0 bottom-2 text-center text-[11px] font-bold text-white drop-shadow"
                      >
                        ${value.toFixed(0)}
                      </motion.span>
                    )}
                  </div>
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: on ? `hsl(${p.color})` : "hsl(var(--muted-foreground))" }}
                  >
                    {p.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
