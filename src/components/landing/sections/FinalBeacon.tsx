"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { BeaconLogo } from "@/components/shared/BeaconLogo";
import { useMotionEnabled } from "../hooks/useIsMobile";

export function FinalBeacon() {
  const router = useRouter();
  const motionEnabled = useMotionEnabled();
  const [ripples, setRipples] = useState<number[]>([]);
  const [lit, setLit] = useState(false);
  const [hovered, setHovered] = useState(false);
  const rippleCounter = useRef(0);

  function light() {
    rippleCounter.current += 1;
    const id = rippleCounter.current;
    setLit(true);
    setRipples((current) => [...current, id]);
    window.setTimeout(() => {
      setRipples((current) => current.filter((item) => item !== id));
    }, 1700);
    window.setTimeout(() => setLit(false), 900);
  }

  function startPlanning() {
    light();
    window.setTimeout(() => router.push(ROUTES.signup), motionEnabled ? 420 : 0);
  }

  const isLit = lit || hovered;

  return (
    <motion.section
      className="landing-journey-chapter max-w-5xl"
    >
      <div
        className={`relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-secondary/15 to-success/15 p-8 transition-colors sm:p-16 ${
          isLit ? "landing-beacon-lit" : ""
        }`}
      >
        <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/30 blur-[120px]" />
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/20 to-transparent transition-opacity ${
            isLit ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          <div className="relative mx-auto h-72 w-52 perspective-[1200px]">
            <motion.svg
              viewBox="0 0 120 210"
              className="h-full w-full"
              initial={false}
              whileHover={motionEnabled ? { rotateY: 10 } : undefined}
              animate={{ rotateY: isLit ? 12 : -8 }}
              transition={{ type: "spring", stiffness: 80, damping: 14 }}
              aria-hidden
            >
              <polygon points="22,205 98,205 86,165 34,165" fill="hsl(var(--foreground) / 0.85)" />
              <polygon points="34,165 86,165 75,63 45,63" fill="hsl(var(--foreground))" />
              {[84, 116, 148].map((y) => (
                <rect key={y} x="38" y={y} width="44" height="8" fill="hsl(var(--background))" />
              ))}
              <rect x="36" y="42" width="48" height="24" fill="hsl(var(--foreground))" />
              <rect
                x="41"
                y="47"
                width="38"
                height="14"
                fill="hsl(var(--primary))"
                className="landing-beacon-light"
              />
              <polygon points="33,42 87,42 60,17" fill="hsl(var(--foreground))" />
              <motion.polygon
                points="60,54 130,0 130,108"
                fill="hsl(var(--primary) / 0.25)"
                animate={motionEnabled ? { opacity: isLit ? [0.45, 0.8, 0.45] : [0.2, 0.48, 0.2] } : { opacity: 0.28 }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.polygon
                points="60,54 -10,0 -10,108"
                fill="hsl(var(--primary) / 0.2)"
                animate={motionEnabled ? { opacity: isLit ? [0.6, 0.24, 0.6] : [0.38, 0.15, 0.38] } : { opacity: 0.22 }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.svg>

            <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center justify-center">
              <BeaconLogo className="h-12 w-12" gradientId="beaconGradient-final" />
            </div>

            <div className="pointer-events-none absolute left-1/2 top-12 h-20 w-20 -translate-x-1/2">
              {hovered && <span className="landing-beacon-ripple landing-beacon-ripple--steady" />}
              {ripples.map((id) => (
                <span key={id} className="landing-beacon-ripple" />
              ))}
            </div>
          </div>

          <div>
            <p className="landing-kicker mb-5">Chapter 07 - The Beacon</p>
            <h2 className="text-balance font-sans text-3xl font-semibold tracking-tight sm:text-5xl">
              Light your <span className="gradient-text">first trip</span>.
            </h2>
            <p className="mt-5 text-base text-muted-foreground">
              Free to start. No credit card. Built for crews of 2-50. Plan your next
              adventure in minutes, not across ten different apps.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onPointerEnter={() => {
                  setHovered(true);
                  light();
                }}
                onPointerLeave={() => setHovered(false)}
                onClick={startPlanning}
                className="landing-cta group relative inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Start planning free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
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
    </motion.section>
  );
}
