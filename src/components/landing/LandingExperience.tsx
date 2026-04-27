"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { BeaconLogo } from "@/components/shared/BeaconLogo";
import { MotionToggle } from "@/components/shared/MotionToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useElementScrollProgress } from "./hooks/useElementScrollProgress";
import { useMotionEnabled } from "./hooks/useIsMobile";
import { ParallaxRange } from "./sections/ParallaxRange";
import { TrailBuilder } from "./sections/TrailBuilder";
import { SupplyCrate } from "./sections/SupplyCrate";
import { ExpenseSplitter } from "./sections/ExpenseSplitter";
import { VoteMountain } from "./sections/VoteMountain";
import { Constellation } from "./sections/Constellation";
import { FinalBeacon } from "./sections/FinalBeacon";

const JOURNEY_SPINE_PATH =
  "M50 0 C50 6 58 10 66 15 C90 26 84 36 61 42 C33 50 15 55 20 63 C28 76 70 70 83 82 C96 93 72 98 50 100";

/** Hero failed to call onReady (edge cases); do not block the page. */
const LANDING_BOOT_HERO_FALLBACK_MS = 1100;
/** Short beat after the hero pipeline reports so the boot exit does not run same frame as GPU work. */
const LANDING_BOOT_REVEAL_DELAY_MS = 90;
/** Never keep the user on the boot overlay longer than this. */
const LANDING_BOOT_MAX_MS = 2500;

const HeroScene = dynamic(
  () => import("./sections/HeroScene").then((m) => m.HeroScene),
  { ssr: false, loading: () => <HeroSceneFallback /> },
);

function HeroSceneFallback() {
  return (
    <div className="landing-hero-fallback" aria-hidden>
      <div className="landing-hero-fallback__ring landing-hero-fallback__ring--outer" />
      <div className="landing-hero-fallback__ring landing-hero-fallback__ring--inner" />
      <div className="landing-hero-fallback__needle" />
      <div className="landing-hero-fallback__ridge landing-hero-fallback__ridge--back" />
      <div className="landing-hero-fallback__ridge landing-hero-fallback__ridge--front" />
    </div>
  );
}

function JourneySpine({
  targetRef,
}: {
  targetRef: RefObject<HTMLElement | null>;
}) {
  const motionEnabled = useMotionEnabled();
  const pathRef = useRef<SVGPathElement>(null);
  const travelerRef = useRef<HTMLDivElement>(null);
  const displayedProgressRef = useRef(0.015);
  const travelerFrameRef = useRef<number | null>(null);
  const updateTravelerPointRef = useRef<((latest: number) => void) | null>(
    null,
  );
  const displayedPathProgress = useMotionValue(0.015);
  const rawProgress = useElementScrollProgress(targetRef, 0, 0.5);
  const travelerOpacity = useTransform(
    rawProgress,
    [0, 0.035, 0.96, 1],
    [0, 1, 1, 0],
  );
  const opacity = useTransform(
    rawProgress,
    [0, 0.025, 0.94, 1],
    [0, 0.86, 0.86, 0.34],
  );

  const updateTravelerPoint = useCallback((latest: number) => {
    const path = pathRef.current;
    const node = travelerRef.current;
    if (!path || !node) return;

    const svg = path.ownerSVGElement;
    if (!svg) return;

    const routePath = path;
    const totalLength = path.getTotalLength();
    const rect = svg.getBoundingClientRect();
    const lowerBound = Math.min(window.innerHeight - 84, window.innerHeight * 0.78);
    const upperBound = Math.max(84, window.innerHeight * 0.2);
    const desiredProgress = Math.max(0.015, Math.min(0.985, latest));

    function pointAt(progress: number) {
      const clamped = Math.max(0.015, Math.min(0.985, progress));
      const point = routePath.getPointAtLength(totalLength * clamped);
      return {
        progress: clamped,
        screenY: rect.top + (point.y / 100) * rect.height,
        x: point.x,
        y: point.y,
      };
    }

    function progressForScreenY(targetY: number) {
      let low = 0.015;
      let high = 0.985;
      const start = pointAt(low).screenY;
      const end = pointAt(high).screenY;

      if (targetY <= start) return low;
      if (targetY >= end) return high;

      for (let i = 0; i < 18; i += 1) {
        const mid = (low + high) / 2;
        if (pointAt(mid).screenY < targetY) {
          low = mid;
        } else {
          high = mid;
        }
      }

      return (low + high) / 2;
    }

    function visiblePoint(progress: number) {
      const minVisibleProgress = progressForScreenY(upperBound);
      const maxVisibleProgress = progressForScreenY(lowerBound);
      const clampedProgress = Math.max(
        minVisibleProgress,
        Math.min(maxVisibleProgress, progress),
      );

      return pointAt(clampedProgress);
    }

    const targetPoint = visiblePoint(desiredProgress);
    const previousProgress = displayedProgressRef.current;
    const previousPoint = pointAt(previousProgress);

    function screenDistanceFromPrevious(progress: number) {
      const nextPoint = pointAt(progress);
      const dx = ((nextPoint.x - previousPoint.x) / 100) * rect.width;
      const dy = nextPoint.screenY - previousPoint.screenY;
      return Math.hypot(dx, dy);
    }

    let nextProgress = targetPoint.progress;
    const maxScreenStep = 24;

    if (screenDistanceFromPrevious(targetPoint.progress) > maxScreenStep) {
      let low = previousProgress;
      let high = targetPoint.progress;

      for (let i = 0; i < 14; i += 1) {
        const mid = (low + high) / 2;
        if (screenDistanceFromPrevious(mid) <= maxScreenStep) {
          low = mid;
        } else {
          high = mid;
        }
      }

      nextProgress = low;
    }

    const point = pointAt(nextProgress);

    if (
      Math.abs(point.progress - targetPoint.progress) > 0.001 &&
      travelerFrameRef.current === null
    ) {
      travelerFrameRef.current = window.requestAnimationFrame(() => {
        travelerFrameRef.current = null;
        updateTravelerPointRef.current?.(latest);
      });
    }

    displayedProgressRef.current = point.progress;
    displayedPathProgress.set(point.progress);

    node.style.setProperty("--traveler-x", `${point.x}%`);
    node.style.setProperty("--traveler-y", `${point.y}%`);
  }, [displayedPathProgress]);

  useEffect(() => {
    updateTravelerPointRef.current = updateTravelerPoint;
  }, [updateTravelerPoint]);

  useEffect(() => {
    updateTravelerPoint(rawProgress.get());
    const initialFrame = window.requestAnimationFrame(() => {
      updateTravelerPoint(rawProgress.get());
    });

    function handleResize() {
      updateTravelerPoint(rawProgress.get());
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.cancelAnimationFrame(initialFrame);
      if (travelerFrameRef.current !== null) {
        window.cancelAnimationFrame(travelerFrameRef.current);
        travelerFrameRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [rawProgress, updateTravelerPoint]);

  useMotionValueEvent(rawProgress, "change", updateTravelerPoint);

  return (
    <>
      <motion.div
        aria-hidden
        className="landing-journey-spine"
        style={motionEnabled ? { opacity } : { opacity: 0.6 }}
      >
        <div className="landing-journey-spine__column">
          <svg
            className="landing-journey-spine__svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="landing-journey-spine-gradient"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor="hsl(var(--primary) / 0.55)" />
                <stop offset="46%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--secondary))" />
              </linearGradient>
              <linearGradient
                id="landing-journey-spine-gradient-dark"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor="hsl(var(--primary) / 0.5)" />
                <stop offset="46%" stopColor="hsl(var(--primary) / 0.92)" />
                <stop offset="100%" stopColor="hsl(var(--primary) / 0.45)" />
              </linearGradient>
            </defs>
            <path
              ref={pathRef}
              d={JOURNEY_SPINE_PATH}
              className="landing-journey-spine__track"
              fill="none"
            />
            <motion.path
              d={JOURNEY_SPINE_PATH}
              className="landing-journey-spine__progress"
              fill="none"
              style={{ pathLength: motionEnabled ? displayedPathProgress : 1 }}
            />
          </svg>
          <motion.div
            ref={travelerRef}
            aria-hidden
            className="landing-journey-spine__traveler"
            style={
              motionEnabled ? { opacity: travelerOpacity } : { opacity: 0 }
            }
          >
            <span className="landing-journey-spine__traveler-halo" />
            <span className="landing-journey-spine__traveler-core" />
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

function LandingBootScreen() {
  return (
    <motion.div
      className="landing-boot-screen"
      exit={{
        opacity: 0,
        transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] },
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="landing-boot-compass">
        <BeaconLogo className="h-12 w-12" gradientId="beaconGradient-boot" />
      </div>
      <p>Preparing the trail</p>
      <div className="landing-boot-line" />
    </motion.div>
  );
}

export function LandingExperience() {
  const motionEnabled = useMotionEnabled();
  const mainRef = useRef<HTMLElement>(null);
  const [heroPipelineReady, setHeroPipelineReady] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    void import("./sections/HeroScene");
  }, []);

  const markHeroPipelineReady = useCallback(() => {
    setHeroPipelineReady(true);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setHeroPipelineReady(true);
    }, LANDING_BOOT_HERO_FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setIsReady(true), LANDING_BOOT_MAX_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!heroPipelineReady) return;
    let cancelReveal: (() => void) | null = null;
    const raf = requestAnimationFrame(() => {
      void mainRef.current?.offsetHeight;
      const t = window.setTimeout(
        () => setIsReady(true),
        motionEnabled ? LANDING_BOOT_REVEAL_DELAY_MS : 0,
      );
      cancelReveal = () => window.clearTimeout(t);
    });
    return () => {
      cancelAnimationFrame(raf);
      cancelReveal?.();
    };
  }, [heroPipelineReady, motionEnabled]);

  return (
    <MotionConfig reducedMotion={motionEnabled ? "never" : "always"}>
      <div className="relative min-h-screen overflow-hidden bg-background">
        <AnimatePresence>{!isReady && <LandingBootScreen />}</AnimatePresence>
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="landing-grid" />
          <div className="landing-orb landing-orb--primary" />
          <div className="landing-orb landing-orb--secondary" />
          <div className="landing-orb landing-orb--tertiary" />
        </div>

        <header
          className="absolute inset-x-0 top-0 z-30 mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6"
          data-ready={isReady}
        >
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <BeaconLogo
              className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
              gradientId="beaconGradient-landing"
            />
            <span className="truncate font-sans text-lg font-semibold tracking-tight text-foreground sm:text-xl">
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

        <main
          ref={mainRef}
          className="landing-journey relative z-10 overflow-hidden"
          data-ready={isReady}
        >
          <JourneySpine targetRef={mainRef} />
          <section className="landing-hero-section relative z-20 mx-auto flex min-h-svh w-full flex-col items-center justify-center px-4 pb-12 pt-24 sm:px-6 sm:pb-14">
            <div className="absolute inset-0 -z-0">
              <Suspense fallback={null}>
                <HeroScene onReady={markHeroPipelineReady} />
              </Suspense>
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 62% 44% at 50% 48%, hsl(var(--background) / 0.82) 0%, hsl(var(--background) / 0.58) 48%, transparent 76%)",
                }}
              />
            </div>

            <div className="landing-hero-copy relative z-10 max-w-4xl text-center">
              <div className="landing-hero-eyebrow landing-fade-up landing-stagger-1 mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-[0_1px_0_0_hsl(var(--foreground)/0.04)] backdrop-blur">
                <span className="landing-badge-dot inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                <Sparkles className="h-3 w-3 text-primary" />
                One shared plan for the whole crew
              </div>
              <h1 className="landing-fade-up landing-stagger-2 text-balance font-sans text-3xl font-semibold tracking-tight text-foreground min-[400px]:text-5xl sm:text-7xl">
                Plan trips <span className="gradient-text">together</span>,
                <br />
                not in 10 different apps.
              </h1>
              <p className="landing-fade-up landing-stagger-3 mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
                Itinerary, supplies, expenses, and votes - collaborative from
                day one. Move your mouse and the compass follows.
              </p>
              <div className="landing-hero-actions landing-fade-up landing-stagger-4 mx-auto mt-9 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center">
                <Link
                  href={ROUTES.signup}
                  className="landing-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Start planning free{" "}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
                <Link
                  href={ROUTES.login}
                  className="landing-cta-ghost inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card/50 px-6 py-3 text-center text-sm font-semibold backdrop-blur transition-colors hover:bg-muted"
                >
                  I already have an account
                </Link>
              </div>
              <a
                href="#range"
                className="landing-scroll-cue landing-fade-up landing-stagger-5 mx-auto mt-14 inline-flex items-center gap-2"
              >
                Follow the trail
                <ArrowDown className="h-3.5 w-3.5" />
              </a>
            </div>
          </section>

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
            <p>&copy; {new Date().getFullYear()} Beacon</p>
            <div className="flex min-h-10 items-center gap-5">
              <Link
                href={ROUTES.login}
                className="transition-colors hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                href={ROUTES.signup}
                className="transition-colors hover:text-foreground"
              >
                Sign up
              </Link>
              <span className="hidden h-3 w-px bg-border min-[400px]:inline-block" />
              <MotionToggle variant="text" />
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
