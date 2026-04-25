"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useLoadingStore } from "@/lib/store/loading";

/**
 * Wrapper around `useRouter()` that fires the global navigation loader for
 * `push` and `replace`. The loader is automatically dismissed by
 * `NavigationProgress` once the new route is committed.
 *
 * Use this for programmatic navigation. `<Link>` clicks are already covered
 * by the global click-capture handler.
 */
export function useNavigate() {
  const router = useRouter();
  const startNavigation = useLoadingStore((s) => s.startNavigation);

  return useMemo(
    () => ({
      push: (href: string, options?: { scroll?: boolean }) => {
        startNavigation();
        router.push(href, options);
      },
      replace: (href: string, options?: { scroll?: boolean }) => {
        startNavigation();
        router.replace(href, options);
      },
      refresh: () => router.refresh(),
      back: () => router.back(),
      forward: () => router.forward(),
      prefetch: (href: string) => router.prefetch(href),
    }),
    [router, startNavigation]
  );
}
