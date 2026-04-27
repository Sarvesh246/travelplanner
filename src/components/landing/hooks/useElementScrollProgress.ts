"use client";

import { useEffect, type RefObject } from "react";
import { useMotionValue } from "framer-motion";

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function useElementScrollProgress(
  targetRef: RefObject<HTMLElement | null>,
  startViewportRatio: number,
  endViewportRatio: number
) {
  const progress = useMotionValue(0);

  useEffect(() => {
    let frame = 0;

    function updateProgress() {
      frame = 0;
      const target = targetRef.current;
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const start = scrollY + rect.top - window.innerHeight * startViewportRatio;
      const end = scrollY + rect.bottom - window.innerHeight * endViewportRatio;
      const distance = Math.max(1, end - start);

      progress.set(clamp01((scrollY - start) / distance));
    }

    function scheduleUpdate() {
      if (frame) return;
      frame = window.requestAnimationFrame(updateProgress);
    }

    updateProgress();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [progress, startViewportRatio, endViewportRatio, targetRef]);

  return progress;
}
