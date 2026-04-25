"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Suspense, useEffect, useState } from "react";
import { AppThemeProvider } from "@/components/layout/AppThemeProvider";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { InvalidSessionRecovery } from "@/components/layout/InvalidSessionRecovery";
import { KeyboardShortcuts } from "@/components/layout/KeyboardShortcuts";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { useCommandPalette } from "@/hooks/useCommandPalette";

/**
 * Locks page scroll while the command palette is open. This avoids the
 * background jumping when the search modal mounts on iOS/desktop with
 * scrollbars and keeps focus management predictable.
 */
function CommandPaletteScrollLock() {
  const open = useCommandPalette((s) => s.open);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);
  return null;
}

/**
 * Previous local builds may leave a stale service worker/chunk cache behind.
 * On localhost we proactively remove it to avoid loading incompatible runtime chunks.
 */
function LocalhostCacheReset() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hostname !== "localhost") return;

    void (async () => {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    })();
  }, []);

  return null;
}

export function RootProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: (failureCount, error) => {
              const status = (error as { status?: number } | undefined)?.status;
              if (status && status >= 400 && status < 500) return false;
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <LocalhostCacheReset />
        <InvalidSessionRecovery />
        <KeyboardShortcuts />
        <LoadingScreen />
        <CommandPalette />
        <CommandPaletteScrollLock />
        {/* useSearchParams() inside NavigationProgress must be wrapped in Suspense
            so the rest of the app can stream while it hydrates. */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <Toaster
          position="bottom-right"
          offset={{ bottom: 16, right: 16 }}
          mobileOffset={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))", right: 12 }}
          toastOptions={{
            classNames: {
              toast:
                "bg-card border border-border text-card-foreground shadow-lg rounded-lg",
              title: "font-semibold text-sm",
              description: "text-muted-foreground text-xs",
              actionButton: "bg-primary text-primary-foreground",
              cancelButton: "bg-muted text-muted-foreground",
              success: "border-success/30",
              error: "border-destructive/30",
            },
          }}
          closeButton
          richColors
        />
      </QueryClientProvider>
    </AppThemeProvider>
  );
}
