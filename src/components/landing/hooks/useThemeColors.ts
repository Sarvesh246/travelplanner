"use client";

import { useEffect, useState } from "react";

export type ThemeColors = {
  isDark: boolean;
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  success: string;
  card: string;
  border: string;
  muted: string;
};

function readVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!v) return fallback;
  return `hsl(${v})`;
}

function snapshot(): ThemeColors {
  const isDark =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  return {
    isDark,
    primary: readVar("--primary", "hsl(163 33% 27%)"),
    secondary: readVar("--secondary", "hsl(131 19% 69%)"),
    background: readVar("--background", "hsl(90 14% 96%)"),
    foreground: readVar("--foreground", "hsl(210 24% 16%)"),
    success: readVar("--success", "hsl(158 33% 37%)"),
    card: readVar("--card", "hsl(0 0% 100%)"),
    border: readVar("--border", "hsl(100 9% 90%)"),
    muted: readVar("--muted", "hsl(100 12% 91%)"),
  };
}

export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(() => ({
    isDark: true,
    primary: "hsl(158 30% 50%)",
    secondary: "hsl(135 12% 26%)",
    background: "hsl(130 8% 8%)",
    foreground: "hsl(90 14% 92%)",
    success: "hsl(160 28% 50%)",
    card: "hsl(135 7% 13%)",
    border: "hsl(130 8% 22%)",
    muted: "hsl(130 6% 18%)",
  }));

  useEffect(() => {
    setColors(snapshot());
    const observer = new MutationObserver(() => setColors(snapshot()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}
