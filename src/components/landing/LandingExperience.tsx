"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { BeaconLogo } from "@/components/shared/BeaconLogo";
import { MotionToggle } from "@/components/shared/MotionToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ParallaxRange } from "./sections/ParallaxRange";
import { TrailBuilder } from "./sections/TrailBuilder";
import { SupplyCrate } from "./sections/SupplyCrate";
import { ExpenseSplitter } from "./sections/ExpenseSplitter";
import { VoteMountain } from "./sections/VoteMountain";
import { Constellation } from "./sections/Constellation";
import { FinalBeacon } from "./sections/FinalBeacon";

const HeroScene = dynamic(
  () => import("./sections/HeroScene").then((m) => m.HeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
    ),
  }
);

export function LandingExperience() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="landing-grid" />
        <div className="landing-orb landing-orb--primary" />
        <div className="landing-orb landing-orb--secondary" />
        <div className="landing-orb landing-orb--tertiary" />
      </div>

      {/* Header */}
      <header className="relative z-30 mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <BeaconLogo className="h-8 w-8 shrink-0" gradientId="beaconGradient-landing" />
          <span className="truncate font-sans text-base font-semibold tracking-tight sm:text-lg">
            Beacon
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1.5 min-[400px]:gap-3">
          <ThemeToggle />
          <Link
            href={ROUTES.login}
            className="inline-flex min-h-10 items-center justify-center rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted min-[400px]:px-4"
          >
            Log in
          </Link>
          <Link
            href={ROUTES.signup}
            className="landing-cta inline-flex min-h-10 items-center rounded-lg bg-primary px-2.5 py-2 text-sm font-semibold text-primary-foreground min-[400px]:px-4"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        {/* HERO — WebGL */}
        <section className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col items-center justify-center px-4 pb-12 pt-10 sm:px-6">
          {/* 3D canvas */}
          <div className="absolute inset-0 -z-0">
            <Suspense fallback={null}>
              <HeroScene />
            </Suspense>
            {/* Soft radial mask so headline reads cleanly */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 45% at 50% 55%, hsl(var(--background) / 0.55), transparent 70%)",
              }}
            />
          </div>

          <div className="relative z-10 max-w-4xl text-center">
            <div className="landing-fade-up landing-stagger-1 mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-[0_1px_0_0_hsl(var(--foreground)/0.04)] backdrop-blur">
              <span className="landing-badge-dot inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              <Sparkles className="h-3 w-3 text-primary" />
              An interactive expedition map for your crew
            </div>
            <h1 className="landing-fade-up landing-stagger-2 text-balance font-sans text-3xl font-semibold tracking-tight text-foreground min-[400px]:text-5xl sm:text-7xl">
              Plan trips <span className="gradient-text">together</span>,
              <br />
              not in 10 different apps.
            </h1>
            <p className="landing-fade-up landing-stagger-3 mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
              Itinerary, supplies, expenses, and votes — collaborative from day one. Move
              your mouse — the compass follows.
            </p>
            <div className="landing-fade-up landing-stagger-4 mx-auto mt-9 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center">
              <Link
                href={ROUTES.signup}
                className="landing-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Start planning free <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
              <Link
                href={ROUTES.login}
                className="landing-cta-ghost inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card/50 px-6 py-3 text-center text-sm font-semibold backdrop-blur transition-colors hover:bg-muted"
              >
                I already have an account
              </Link>
            </div>
            <div className="landing-fade-up landing-stagger-5 mt-16 flex flex-col items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Scroll to begin the expedition</span>
              <span
                aria-hidden
                className="block h-8 w-[1px] animate-pulse bg-gradient-to-b from-primary/60 to-transparent"
              />
            </div>
          </div>
        </section>

        {/* Sections */}
        <ParallaxRange />
        <TrailBuilder />
        <SupplyCrate />
        <ExpenseSplitter />
        <VoteMountain />
        <Constellation />
        <FinalBeacon />
      </main>

      <footer className="relative z-10 border-t border-border/70 bg-background/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground min-[400px]:flex-row min-[400px]:px-6 min-[400px]:text-left">
          <p>© {new Date().getFullYear()} Beacon</p>
          <div className="flex min-h-10 items-center gap-5">
            <Link href={ROUTES.login} className="transition-colors hover:text-foreground">
              Log in
            </Link>
            <Link href={ROUTES.signup} className="transition-colors hover:text-foreground">
              Sign up
            </Link>
            <span className="hidden h-3 w-px bg-border min-[400px]:inline-block" />
            <MotionToggle variant="text" />
          </div>
        </div>
      </footer>
    </div>
  );
}
