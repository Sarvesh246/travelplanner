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

export type LandingQualityTier = "full" | "balanced";

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

function readScrollY() {
  if (typeof window === "undefined") return 0;
  return window.scrollY || window.pageYOffset || 0;
}

function readViewport(): LandingViewportSnapshot {
  if (typeof window === "undefined") {
    return { width: 1280, height: 800 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function detectInitialQualityTier(): LandingQualityTier {
  if (typeof window === "undefined") return "full";

  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const lowMemory =
    typeof navigator !== "undefined" &&
    "deviceMemory" in navigator &&
    typeof navigator.deviceMemory === "number" &&
    navigator.deviceMemory <= 4;
  const lowConcurrency =
    typeof navigator !== "undefined" &&
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 6;

  return coarsePointer || lowMemory || lowConcurrency ? "balanced" : "full";
}

export function LandingMotionProvider({ children }: { children: ReactNode }) {
  const initialViewport = readViewport();
  const scrollY = useMotionValue(readScrollY());
  const viewportWidth = useMotionValue(initialViewport.width);
  const viewportHeight = useMotionValue(initialViewport.height);
  const [qualityTier, setQualityTier] = useState<LandingQualityTier>(
    detectInitialQualityTier,
  );
  const [viewport, setViewport] = useState<LandingViewportSnapshot>(initialViewport);
  const frameRef = useRef<number | null>(null);

  const updateSnapshot = useCallback(() => {
    frameRef.current = null;
    const nextViewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    scrollY.set(window.scrollY || window.pageYOffset || 0);
    viewportWidth.set(nextViewport.width);
    viewportHeight.set(nextViewport.height);
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
    setQualityTier((current) => (current === "full" ? "balanced" : current));
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
