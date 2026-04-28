"use client";

import { useEffect, useState } from "react";

const HEALTH_CHECK_PATH = "/api/health";
const PROBE_TIMEOUT_MS = 5000;
const OFFLINE_FAILURE_THRESHOLD = 2;

/**
 * `navigator.onLine` and the `offline` event are unreliable (especially on load and on Windows).
 * Treat the app as offline only after repeated failed same-origin health probes.
 */
export function useNetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let failedProbes = 0;

    async function probeOrigin(): Promise<boolean> {
      if (typeof window === "undefined") return true;
      const url = new URL(HEALTH_CHECK_PATH, window.location.origin);
      url.searchParams.set("t", Date.now().toString());

      for (const method of ["HEAD", "GET"] as const) {
        const ctrl = new AbortController();
        const t = window.setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
        try {
          const res = await fetch(url, {
            method,
            cache: "no-store",
            credentials: "same-origin",
            signal: ctrl.signal,
          });
          if (res.ok || res.status < 500) return true;
        } catch {
          /* try next method */
        } finally {
          window.clearTimeout(t);
        }
      }
      return false;
    }

    async function reconcile() {
      const reachable = await probeOrigin();
      if (cancelled) return;
      if (reachable) {
        failedProbes = 0;
        setOnline(true);
        return;
      }
      failedProbes += 1;
      setOnline(failedProbes < OFFLINE_FAILURE_THRESHOLD);
    }

    function handleOnline() {
      setOnline(true);
    }

    /** Confirm with an origin probe before showing offline (avoids spurious `offline` on load). */
    function handleOffline() {
      void reconcile();
    }

    function onVisibilityOrFocus() {
      void reconcile();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);
    window.addEventListener("pageshow", onVisibilityOrFocus);
    window.addEventListener("focus", onVisibilityOrFocus);

    void reconcile();

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      window.removeEventListener("pageshow", onVisibilityOrFocus);
      window.removeEventListener("focus", onVisibilityOrFocus);
    };
  }, []);

  return online;
}
