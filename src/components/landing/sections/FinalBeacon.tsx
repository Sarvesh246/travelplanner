"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/constants";

export function FinalBeacon() {
  const [ripples, setRipples] = useState<number[]>([]);

  function light() {
    const id = Date.now();
    setRipples((r) => [...r, id]);
    setTimeout(() => {
      setRipples((r) => r.filter((x) => x !== id));
    }, 1700);
  }

  return (
    <section className="relative mx-auto max-w-5xl px-4 py-32 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-secondary/15 to-success/15 p-8 sm:p-16">
        {/* Soft glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/30 blur-[120px]" />

        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          {/* Beacon Tower */}
          <div className="relative mx-auto h-72 w-48 perspective-[1200px]">
            <motion.svg
              viewBox="0 0 100 200"
              className="h-full w-full"
              initial={{ rotateY: -10 }}
              whileHover={{ rotateY: 10 }}
              transition={{ type: "spring", stiffness: 80, damping: 14 }}
              aria-hidden
            >
              {/* Base */}
              <polygon points="20,200 80,200 70,160 30,160" fill="hsl(var(--foreground) / 0.85)" />
              {/* Body */}
              <polygon points="30,160 70,160 62,60 38,60" fill="hsl(var(--foreground))" />
              {/* Stripes */}
              {[80, 110, 140].map((y) => (
                <rect key={y} x="32" y={y} width="36" height="8" fill="hsl(var(--background))" />
              ))}
              {/* Lantern room */}
              <rect x="30" y="40" width="40" height="22" fill="hsl(var(--foreground))" />
              <rect x="34" y="44" width="32" height="14" fill="hsl(var(--primary))" className="landing-beacon-light" />
              {/* Roof */}
              <polygon points="28,40 72,40 50,18" fill="hsl(var(--foreground))" />
              {/* Light beam */}
              <motion.polygon
                points="50,50 110,0 110,100"
                fill="hsl(var(--primary) / 0.25)"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.polygon
                points="50,50 -10,0 -10,100"
                fill="hsl(var(--primary) / 0.2)"
                animate={{ opacity: [0.4, 0.15, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.svg>

            {/* Ripples */}
            <div className="pointer-events-none absolute left-1/2 top-12 h-20 w-20 -translate-x-1/2">
              {ripples.map((id) => (
                <span key={id} className="landing-beacon-ripple" />
              ))}
            </div>
          </div>

          {/* Copy + CTA */}
          <div>
            <p className="landing-kicker mb-5">Chapter 07 — The Beacon</p>
            <h2 className="text-balance font-sans text-3xl font-semibold tracking-tight sm:text-5xl">
              Light your <span className="gradient-text">first trip</span>.
            </h2>
            <p className="mt-5 text-base text-muted-foreground">
              Free to start. No credit card. Built for crews of 2–50. Plan your next
              adventure in minutes — not in 10 different apps.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link
                href={ROUTES.signup}
                onMouseEnter={light}
                onClick={light}
                className="landing-cta group relative inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Light the beacon — start free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={ROUTES.login}
                className="landing-cta-ghost inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-card/50 px-6 py-3 text-sm font-semibold backdrop-blur"
              >
                I already have an account
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Free forever plan
              </span>
              <span>No credit card</span>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
