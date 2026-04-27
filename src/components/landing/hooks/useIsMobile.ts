"use client";

import { useCallback, useSyncExternalStore } from "react";

export function useIsMobile(breakpoint = 640): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    [breakpoint]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  }, [breakpoint]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

function subscribeMotion(callback: () => void) {
  if (typeof document === "undefined") return () => {};
  const obs = new MutationObserver(callback);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-motion"],
  });
  return () => obs.disconnect();
}

function getMotionSnapshot() {
  if (typeof document === "undefined") return true;
  return document.documentElement.getAttribute("data-motion") !== "reduced";
}

export function useMotionEnabled(): boolean {
  return useSyncExternalStore(subscribeMotion, getMotionSnapshot, () => true);
}
