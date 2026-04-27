"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMotionValue, type MotionValue } from "framer-motion";

export type LandingQualityTier = "full" | "balanced" | "static";

type LandingViewportSnapshot = {
  width: number;
  height: number;
};

type LandingMotionRuntime = {
  qualityTier: LandingQualityTier;
  scrollY: MotionValue<number>;
  viewport: LandingViewportSnapshot;
  viewportHeight: MotionValue<number>;
  viewportWidth: MotionValue<number>;
  downgradeQuality: () => void;
};

const LandingMotionContext = createContext<LandingMotionRuntime | null>(null);
const DEFAULT_VIEWPORT: LandingViewportSnapshot = { width: 1280, height: 800 };

function readScrollY() {
  if (typeof window === "undefined") return 0;
  return window.scrollY || window.pageYOffset || 0;
}

function readViewport(): LandingViewportSnapshot {
  if (typeof window === "undefined") return DEFAULT_VIEWPORT;

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function detectInitialQualityTier(): LandingQualityTier {
  if (typeof window === "undefined") return "full";

  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const desktopViewport = window.innerWidth >= 1024;
  const lowMemory =
    typeof navigator !== "undefined" &&
    "deviceMemory" in navigator &&
    typeof navigator.deviceMemory === "number" &&
    navigator.deviceMemory <= 4;
  const lowConcurrency =
    typeof navigator !== "undefined" &&
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 6;

  if (desktopViewport && (lowMemory || lowConcurrency)) return "static";
  if (coarsePointer || desktopViewport) return "balanced";
  if (lowMemory || lowConcurrency) return "balanced";
  return "full";
}

export function LandingMotionProvider({ children }: { children: ReactNode }) {
  const scrollY = useMotionValue(0);
  const viewportWidth = useMotionValue(DEFAULT_VIEWPORT.width);
  const viewportHeight = useMotionValue(DEFAULT_VIEWPORT.height);
  const [qualityTier, setQualityTier] = useState<LandingQualityTier>("full");
  const [viewport, setViewport] =
    useState<LandingViewportSnapshot>(DEFAULT_VIEWPORT);
  const frameRef = useRef<number | null>(null);

  const updateSnapshot = useCallback(() => {
    frameRef.current = null;
    const nextViewport = readViewport();

    scrollY.set(readScrollY());
    viewportWidth.set(nextViewport.width);
    viewportHeight.set(nextViewport.height);
    setQualityTier((current) => {
      const nextTier = detectInitialQualityTier();
      return current === nextTier ? current : nextTier;
    });
    setViewport((current) =>
      current.width === nextViewport.width && current.height === nextViewport.height
        ? current
        : nextViewport,
    );
  }, [scrollY, viewportHeight, viewportWidth]);

  const scheduleUpdate = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(updateSnapshot);
  }, [updateSnapshot]);

  useEffect(() => {
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [scheduleUpdate, updateSnapshot]);

  const downgradeQuality = useCallback(() => {
    setQualityTier((current) => {
      if (current === "full") return "balanced";
      if (current === "balanced") return "static";
      return current;
    });
  }, []);

  const value = useMemo(
    () => ({
      qualityTier,
      scrollY,
      viewport,
      viewportHeight,
      viewportWidth,
      downgradeQuality,
    }),
    [
      downgradeQuality,
      qualityTier,
      scrollY,
      viewport,
      viewportHeight,
      viewportWidth,
    ],
  );

  return (
    <LandingMotionContext.Provider value={value}>
      {children}
    </LandingMotionContext.Provider>
  );
}

export function useLandingMotionRuntime() {
  const runtime = useContext(LandingMotionContext);
  if (!runtime) {
    throw new Error("useLandingMotionRuntime must be used within LandingMotionProvider.");
  }
  return runtime;
}
