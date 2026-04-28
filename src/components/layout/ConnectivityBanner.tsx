"use client";

import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function ConnectivityBanner() {
  const online = useNetworkStatus();

  if (online) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top,0px)+3.65rem)] z-[35] flex justify-center sm:inset-x-4 md:top-[calc(env(safe-area-inset-top,0px)+0.75rem)] md:z-[95]">
      <div className="app-glass max-w-[min(36rem,calc(100vw-1.5rem))] flex items-center gap-2 rounded-full border border-warning/40 bg-card/94 px-3 py-2 text-xs font-medium text-foreground shadow-[0_16px_32px_-22px_hsl(var(--foreground)/0.45)]">
        <WifiOff className="h-3.5 w-3.5 text-warning" />
        <span>Offline. Changes may not sync until you reconnect.</span>
      </div>
    </div>
  );
}
