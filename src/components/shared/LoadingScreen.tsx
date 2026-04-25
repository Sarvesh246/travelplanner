"use client";

import { useLoadingStore } from "@/lib/store/loading";
import { BeaconLogo } from "@/components/shared/BeaconLogo";

/**
 * Sitewide loading overlay — concentric beacon rings pulsing outward over a
 * blurred backdrop. Driven by the loading store, which itself is fed by:
 *  - explicit `startLoading()` calls (e.g. signing out, uploading)
 *  - the global `NavigationProgress` watcher (route changes)
 *
 * The backdrop blur paints immediately (no fade) so the page snaps behind the
 * loader. Only the inner content fades in for a small bit of delight.
 */
export function LoadingScreen() {
  const isLoading = useLoadingStore((s) => s.isLoading);
  const message = useLoadingStore((s) => s.message);
  const source = useLoadingStore((s) => s.source);

  if (!isLoading) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-source={source ?? undefined}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      {/* Instant blur backdrop — does NOT animate in */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md" aria-hidden />

      <div className="relative flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-150 ease-out">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full bg-primary/15 animate-beacon-ping-slow motion-reduce:hidden"
            aria-hidden
          />
          <span
            className="absolute inset-3 rounded-full bg-primary/20 animate-beacon-ping motion-reduce:hidden"
            aria-hidden
          />
          <span
            className="absolute inset-5 rounded-full bg-primary/25 motion-reduce:hidden"
            aria-hidden
          />
          <BeaconLogo
            ariaLabel="Beacon"
            className="relative h-16 w-16 animate-beacon-pulse motion-reduce:animate-pulse"
          />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-foreground">
            {message || "Loading…"}
          </p>
          <span className="sr-only">Please wait while we load this view.</span>
        </div>
      </div>
    </div>
  );
}
