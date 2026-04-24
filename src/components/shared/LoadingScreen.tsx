"use client";

import { useLoadingStore } from "@/lib/store/loading";

export function LoadingScreen() {
  const { isLoading, message } = useLoadingStore();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="flex flex-col items-center gap-4">
        {/* Pulsing Beacon Logo */}
        <div className="relative w-24 h-24">
          <svg
            viewBox="0 0 64 64"
            className="w-full h-full animate-pulse"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="beaconLoadingGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "hsl(var(--secondary))", stopOpacity: 0.8 }} />
              </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2" opacity="0.3" />
            <circle cx="32" cy="32" r="20" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2" opacity="0.6" />
            <circle cx="32" cy="32" r="12" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" opacity="0.9" />
            <circle cx="32" cy="32" r="4" fill="hsl(var(--primary))" />
            <circle cx="32" cy="32" r="2.5" fill="hsl(var(--primary))" opacity="0.6" />
          </svg>
        </div>

        {/* Loading Text */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-foreground font-semibold text-lg">
            {message || "Loading..."}
          </p>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0s" }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
