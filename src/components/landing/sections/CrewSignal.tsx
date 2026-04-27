"use client";

import { motion } from "framer-motion";
import { Eye, ShieldCheck, UserPlus, Users2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useMotionEnabled } from "../hooks/useIsMobile";

type SignalNode = {
  description: string;
  detail: string;
  id: string;
  label: string;
  Icon: typeof UserPlus;
  position: {
    x: string;
    y: string;
  };
};

const SIGNAL_NODES: SignalNode[] = [
  {
    id: "invite",
    label: "Invite links",
    description: "Send the route before the group chat explodes.",
    detail:
      "Share one link, bring late joiners in fast, and keep the plan anchored to a single trip.",
    Icon: UserPlus,
    position: { x: "22%", y: "22%" },
  },
  {
    id: "viewer",
    label: "Viewer access",
    description: "Let passengers follow along without editing the plan.",
    detail:
      "Give parents, drivers, or tentative friends a read-only view so the itinerary stays clean.",
    Icon: Eye,
    position: { x: "78%", y: "22%" },
  },
  {
    id: "members",
    label: "Shared ownership",
    description: "Expenses, supplies, and votes stay with the crew.",
    detail:
      "Everyone sees the same source of truth as the route changes, the crate fills, and the split updates.",
    Icon: Users2,
    position: { x: "78%", y: "78%" },
  },
  {
    id: "admins",
    label: "Admin controls",
    description: "Keep destructive actions scoped to the right people.",
    detail:
      "Roles stop accidental edits while still making collaboration feel instant for the people doing the work.",
    Icon: ShieldCheck,
    position: { x: "22%", y: "78%" },
  },
];

export function CrewSignal() {
  const motionEnabled = useMotionEnabled();
  const [activeId, setActiveId] = useState(SIGNAL_NODES[0].id);
  const activeNode = useMemo(
    () => SIGNAL_NODES.find((node) => node.id === activeId) ?? SIGNAL_NODES[0],
    [activeId],
  );

  return (
    <motion.section className="landing-journey-chapter max-w-6xl">
      <div className="mb-12 text-center">
        <p className="landing-kicker mb-5">Chapter 06 - The Signal</p>
        <h2 className="text-balance font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
          Keep the <span className="gradient-text">crew aligned</span> before
          the trip gets noisy.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Invites, read-only access, and permissions stay inside the same trip
          plan, so collaboration scales without turning chaotic.
        </p>
      </div>

      <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <h3 className="font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
            One trip, one route, one control tower.
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              "Invite by link or email without rebuilding the plan for every new person.",
              "Use viewer access for people who need visibility without edit power.",
              "Keep admin-only actions separated from routine collaboration.",
              "Hand the whole crew the same itinerary, supply list, vote board, and split ledger.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="landing-glass relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,hsl(var(--primary)/0.14),transparent_38%),linear-gradient(180deg,transparent,hsl(var(--background)/0.18))]" />

          <div className="relative grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="relative aspect-square w-full max-w-[32rem] mx-auto overflow-hidden rounded-[1.75rem] border border-border/50 bg-background/25">
              <svg className="absolute inset-0 h-full w-full" aria-hidden>
                {SIGNAL_NODES.map((node) => (
                  <line
                    key={node.id}
                    x1="50%"
                    y1="50%"
                    x2={node.position.x}
                    y2={node.position.y}
                    stroke="hsl(var(--primary) / 0.26)"
                    strokeWidth="1.5"
                    strokeDasharray="6 8"
                  />
                ))}
              </svg>

              <div className="absolute left-1/2 top-1/2 z-10 w-[28%] min-w-[7.5rem] max-w-[11rem] -translate-x-1/2 -translate-y-1/2 rounded-[1.5rem] border border-primary/30 bg-card/85 px-3 py-4 text-center shadow-[0_24px_54px_-32px_hsl(var(--primary)/0.55)] backdrop-blur-sm sm:px-4 sm:py-5">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary sm:mb-3 sm:h-12 sm:w-12">
                  <Users2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-[10px]">
                  Beacon Trip
                </p>
                <p className="mt-1 text-xs font-semibold text-foreground sm:text-sm">
                  Shared plan
                </p>
              </div>

              {SIGNAL_NODES.map((node) => {
                const selected = node.id === activeNode.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onFocus={() => setActiveId(node.id)}
                    onMouseEnter={() => setActiveId(node.id)}
                    onClick={() => setActiveId(node.id)}
                    className={`absolute z-20 w-[26%] min-w-[6.5rem] max-w-[8.5rem] -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-2.5 py-2.5 text-left outline-none transition-[transform,border-color,box-shadow,background-color] duration-500 focus-visible:ring-2 focus-visible:ring-ring sm:px-3 sm:py-3 ${
                      selected
                        ? "border-primary/45 bg-card/90 shadow-[0_24px_48px_-28px_hsl(var(--primary)/0.6)]"
                        : "border-border/60 bg-card/72 hover:-translate-y-[52%] hover:border-primary/30"
                    }`}
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/12 text-primary sm:mb-2 sm:h-9 sm:w-9">
                      <node.Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <p className="text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
                      {node.label}
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">
                      {node.id === "viewer" ? "Follow-only" : "Crew-ready"}
                    </p>
                  </button>
                );
              })}
            </div>

            <motion.div
              key={activeNode.id}
              initial={motionEnabled ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="flex min-h-[26rem] flex-col justify-between rounded-[1.75rem] border border-border/60 bg-card/72 p-5 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)]"
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                  Active signal
                </p>
                <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <activeNode.Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-sans text-2xl font-semibold tracking-tight">
                  {activeNode.label}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground">
                  {activeNode.description}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {activeNode.detail}
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-primary/18 bg-primary/8 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Trip status
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground">6 people invited</span>
                  <span className="rounded-full bg-primary/14 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    2 viewers
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground">3 can edit</span>
                  <span className="rounded-full bg-secondary/18 px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                    1 admin
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
