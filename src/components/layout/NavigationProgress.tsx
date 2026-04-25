"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoadingStore } from "@/lib/store/loading";

/**
 * Detects route transitions and shows the global loading screen.
 *
 * - Captures clicks on internal `<a>` (and therefore `<Link>`) elements and
 *   schedules the loader after a small grace period (`startNavigation`). Quick
 *   prefetched navigations finish before the grace period elapses, so the user
 *   doesn't see a flash for instant pages.
 * - Stops the loader whenever pathname or searchParams change.
 * - Stops the loader on browser back/forward and bfcache restores.
 *
 * Renders nothing.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const startNavigation = useLoadingStore((s) => s.startNavigation);
  const stopLoading = useLoadingStore((s) => s.stopLoading);

  // Stop loading whenever the route resolves.
  useEffect(() => {
    stopLoading();
  }, [pathname, searchParams, stopLoading]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      const linkTarget = anchor.getAttribute("target");
      if (linkTarget && linkTarget !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (href.startsWith("#")) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same path + search => no navigation, don't show.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      startNavigation();
    };

    const handlePop = () => stopLoading();

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePop);
    window.addEventListener("pageshow", handlePop);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePop);
      window.removeEventListener("pageshow", handlePop);
    };
  }, [startNavigation, stopLoading]);

  return null;
}
