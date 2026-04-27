"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { LANDING_SECTION_VIEWPORT } from "../landing-viewport";

const PEOPLE = [
  { id: "alex", name: "Alex", color: "163 33% 35%" },
  { id: "mira", name: "Mira", color: "131 35% 50%" },
  { id: "jules", name: "Jules", color: "39 60% 55%" },
  { id: "sam", name: "Sam", color: "200 45% 50%" },
  { id: "leo", name: "Leo", color: "12 55% 55%" },
];

function AnimatedMoney({
  className,
  decimals = 0,
  value,
}: {
  className?: string;
  decimals?: number;
  value: number;
}) {
  const raw = useMotionValue(value);
  const label = useTransform(raw, (latest) => `$${latest.toFixed(decimals)}`);

  useEffect(() => {
    const controls = animate(raw, value, {
      duration: 0.16,
      ease: [0.16, 1, 0.3, 1],
    });

    return controls.stop;
  }, [raw, value]);

  return <motion.span className={className}>{label}</motion.span>;
}

export function ExpenseSplitter() {
  const [total, setTotal] = useState(920);
  const [included, setIncluded] = useState<Set<string>>(
    new Set(PEOPLE.map((p) => p.id)),
  );

  const payer = PEOPLE[1];
  const share = useMemo(
    () => total / Math.max(included.size, 1),
    [included.size, total],
  );
  const activePeople = useMemo(
    () => PEOPLE.filter((person) => included.has(person.id)),
    [included],
  );

  function toggle(id: string) {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const payerIndex = PEOPLE.findIndex((person) => person.id === payer.id);
  const payerX = ((payerIndex + 0.5) / PEOPLE.length) * 100;
  const totalPct = ((total - 100) / (2000 - 100)) * 100;
  const rangeStyle = { "--range-progress": `${totalPct}%` } as CSSProperties;

  return (
    <motion.section
      className="landing-journey-chapter max-w-6xl"
      initial={{ opacity: 0, y: 64 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={LANDING_SECTION_VIEWPORT}
      transition={{ type: "spring", stiffness: 78, damping: 22 }}
    >
      <div className="mb-12 text-center">
        <p className="landing-kicker mb-5">Chapter 04 - The Split</p>
        <h2 className="text-balance font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
          Fair splits, <span className="gradient-text">no spreadsheet</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Drag the slider, tap people in or out, and watch the balances reroute
          live.
        </p>
      </div>

      <div className="landing-glass rounded-3xl p-6 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="mb-6">
              <label
                htmlFor="trip-cost"
                className="mb-3 flex items-center justify-between gap-4 text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                <span>Trip cost</span>
                <AnimatedMoney
                  value={total}
                  className="font-sans text-2xl font-bold text-foreground"
                />
              </label>
              <div className="landing-range-track" style={rangeStyle}>
                <span className="landing-range-fill" />
                <input
                  id="trip-cost"
                  type="range"
                  min="100"
                  max="2000"
                  step="20"
                  value={total}
                  onInput={(e) => setTotal(Number(e.currentTarget.value))}
                  onChange={(e) => setTotal(Number(e.target.value))}
                  className="landing-range-input"
                />
              </div>
            </div>

            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Crew ({included.size} in)
            </p>
            <div className="flex flex-wrap gap-2">
              {PEOPLE.map((person) => {
                const on = included.has(person.id);
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => toggle(person.id)}
                    className="group relative flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring"
                    style={{
                      borderColor: on
                        ? `hsl(${person.color})`
                        : "hsl(var(--border))",
                      backgroundColor: on
                        ? `hsl(${person.color} / 0.12)`
                        : "transparent",
                      color: on
                        ? `hsl(${person.color})`
                        : "hsl(var(--muted-foreground))",
                    }}
                    aria-pressed={on}
                  >
                    <span
                      className="h-2 w-2 rounded-full transition-transform"
                      style={{
                        backgroundColor: `hsl(${person.color})`,
                        transform: on ? "scale(1.4)" : "scale(1)",
                      }}
                    />
                    {person.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Each active person owes
              </p>
              <AnimatedMoney
                value={share}
                decimals={2}
                className="mt-1 block font-sans text-3xl font-bold text-primary sm:text-4xl"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {payer.name} paid the shared booking. Beacon turns the rest into
                settle-up paths.
              </p>
            </div>
          </div>

          <div className="relative min-h-[24rem] rounded-2xl border border-border/60 bg-background/25 p-4 sm:p-5">
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <marker
                  id="split-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path
                    d="M 0 0 L 10 5 L 0 10 z"
                    fill="hsl(var(--primary) / 0.75)"
                  />
                </marker>
              </defs>
              {PEOPLE.map((person, index) => {
                if (!included.has(person.id) || person.id === payer.id)
                  return null;
                const x = ((index + 0.5) / PEOPLE.length) * 100;
                return (
                  <motion.path
                    key={person.id}
                    d={`M ${x} 70 C ${x} 48, ${payerX} 48, ${payerX} 26`}
                    fill="none"
                    stroke="hsl(var(--primary) / 0.42)"
                    strokeWidth="1.5"
                    strokeDasharray="5 6"
                    markerEnd="url(#split-arrow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ pathLength: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  />
                );
              })}
            </svg>

            <div className="relative z-10 flex h-20 items-center justify-around">
              {PEOPLE.map((person) => {
                const on = included.has(person.id);
                return (
                  <motion.div
                    key={person.id}
                    animate={{
                      opacity: on ? 1 : 0.32,
                      scale: person.id === payer.id ? 1.08 : 1,
                    }}
                    transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center gap-1 text-[11px] font-medium"
                    style={{
                      color: on
                        ? `hsl(${person.color})`
                        : "hsl(var(--muted-foreground))",
                    }}
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold"
                      style={{
                        borderColor: `hsl(${person.color} / ${on ? 0.65 : 0.24})`,
                        backgroundColor: `hsl(${person.color} / ${on ? 0.15 : 0.05})`,
                      }}
                    >
                      {person.name.slice(0, 1)}
                    </span>
                    {person.id === payer.id ? "paid" : person.name}
                  </motion.div>
                );
              })}
            </div>

            <div className="relative z-10 mt-8 flex h-56 items-end gap-3 sm:gap-4">
              {PEOPLE.map((person) => {
                const on = included.has(person.id);
                const barValue = on ? share : 0;
                const pct = on
                  ? Math.min(92, Math.max(20, (barValue / 520) * 100))
                  : 6;
                return (
                  <div
                    key={person.id}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div className="relative flex h-full w-full items-end overflow-hidden rounded-xl border border-border/45 bg-muted/55">
                      <motion.div
                        className="w-full rounded-xl"
                        initial={false}
                        animate={{ height: `${pct}%`, opacity: on ? 1 : 0.22 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          background: `linear-gradient(to top, hsl(${person.color}), hsl(${person.color} / 0.78))`,
                          boxShadow: `0 -10px 26px -6px hsl(${person.color} / 0.65)`,
                        }}
                      />
                      {on && (
                        <motion.span
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute inset-x-0 bottom-2 text-center text-[11px] font-bold text-white drop-shadow"
                        >
                          ${barValue.toFixed(0)}
                        </motion.span>
                      )}
                    </div>
                    <span
                      className="text-[11px] font-medium"
                      style={{
                        color: on
                          ? `hsl(${person.color})`
                          : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {person.name}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="relative z-10 mt-4 text-xs text-muted-foreground">
              {activePeople.length - 1} settle-up path
              {activePeople.length === 2 ? "" : "s"} to {payer.name}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
