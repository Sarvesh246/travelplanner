"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";
import { useMotionValue, useMotionValueEvent } from "framer-motion";
import { useLandingMotionRuntime } from "./useLandingMotionRuntime";

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function useElementScrollProgress(
  targetRef: RefObject<HTMLElement | null>,
  startViewportRatio: number,
  endViewportRatio: number
) {
  const runtime = useLandingMotionRuntime();
  const progress = useMotionValue(0);
  const boundsRef = useRef<{ top: number; bottom: number } | null>(null);
  const measureFrameRef = useRef<number | null>(null);

  const updateProgress = useCallback(
    (scrollY: number, viewportHeight: number) => {
      const bounds = boundsRef.current;
      if (!bounds) return;

      const start = bounds.top - viewportHeight * startViewportRatio;
      const end = bounds.bottom - viewportHeight * endViewportRatio;
      const distance = Math.max(1, end - start);

      progress.set(clamp01((scrollY - start) / distance));
    },
    [endViewportRatio, progress, startViewportRatio]
  );

  const measureBounds = useCallback(() => {
    measureFrameRef.current = null;
    const target = targetRef.current;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const scrollY = runtime.scrollY.get();
    boundsRef.current = {
      top: scrollY + rect.top,
      bottom: scrollY + rect.bottom,
    };
    updateProgress(scrollY, runtime.viewportHeight.get());
  }, [runtime.scrollY, runtime.viewportHeight, targetRef, updateProgress]);

  const scheduleMeasure = useCallback(() => {
    if (measureFrameRef.current !== null) return;
    measureFrameRef.current = window.requestAnimationFrame(measureBounds);
  }, [measureBounds]);

  useLayoutEffect(() => {
    measureBounds();
  }, [measureBounds]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(target);

    return () => observer.disconnect();
  }, [scheduleMeasure, targetRef]);

  useEffect(() => {
    return () => {
      if (measureFrameRef.current !== null) {
        window.cancelAnimationFrame(measureFrameRef.current);
      }
    };
  }, []);

  useMotionValueEvent(runtime.scrollY, "change", (latest) => {
    updateProgress(latest, runtime.viewportHeight.get());
  });

  useMotionValueEvent(runtime.viewportHeight, "change", () => {
    scheduleMeasure();
  });

  useMotionValueEvent(runtime.viewportWidth, "change", () => {
    scheduleMeasure();
  });

  return progress;
}
