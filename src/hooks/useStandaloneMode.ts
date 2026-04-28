"use client";

import { useSyncExternalStore } from "react";

export function useStandaloneMode(): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};

      const mq = window.matchMedia("(display-mode: standalone)");
      mq.addEventListener("change", callback);
      window.addEventListener("pageshow", callback);

      return () => {
        mq.removeEventListener("change", callback);
        window.removeEventListener("pageshow", callback);
      };
    },
    () => {
      if (typeof window === "undefined") return false;

      const iosStandalone =
        typeof window.navigator !== "undefined" &&
        "standalone" in window.navigator &&
        window.navigator.standalone === true;

      return (
        iosStandalone || window.matchMedia("(display-mode: standalone)").matches
      );
    },
    () => false
  );
}
