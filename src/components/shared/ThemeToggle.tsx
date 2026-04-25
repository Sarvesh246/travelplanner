"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};
/**
 * Stable "are we hydrated?" flag that doesn't trigger the
 * `react-hooks/set-state-in-effect` lint rule. Returns `false` on the server
 * and during initial hydration, then `true` from the first commit onward.
 */
function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isClient = useIsClient();

  // While SSR / pre-hydration, default to dark (matches `<html className="dark">`).
  // Once on the client, follow the resolved theme so the icon matches reality.
  const isDark = isClient ? (resolvedTheme ?? theme) === "dark" : true;

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title="Toggle theme (T)"
    >
      <Sun
        className={cn(
          "w-4 h-4 transition-transform duration-300 ease-out",
          isDark ? "-rotate-90 scale-0" : "rotate-0 scale-100"
        )}
      />
      <Moon
        className={cn(
          "absolute w-4 h-4 transition-transform duration-300 ease-out",
          isDark ? "rotate-0 scale-100" : "rotate-90 scale-0"
        )}
      />
    </button>
  );
}
