"use client";

import { useMemo, useSyncExternalStore } from "react";

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

function readRawVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function asHsl(value: string): string {
  return value.startsWith("hsl(") ? value : `hsl(${value})`;
}

const SERVER_KEY = [
  "dark",
  "158 30% 50%",
  "135 12% 26%",
  "130 8% 8%",
  "90 14% 92%",
  "160 28% 50%",
  "135 7% 13%",
  "130 8% 22%",
  "130 6% 18%",
].join("|");

function snapshotKey(): string {
  const isDark =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  return [
    isDark ? "dark" : "light",
    readRawVar("--primary", isDark ? "158 30% 50%" : "163 33% 27%"),
    readRawVar("--secondary", isDark ? "135 12% 26%" : "131 19% 69%"),
    readRawVar("--background", isDark ? "130 8% 8%" : "90 14% 96%"),
    readRawVar("--foreground", isDark ? "90 14% 92%" : "210 24% 16%"),
    readRawVar("--success", isDark ? "160 28% 50%" : "158 33% 37%"),
    readRawVar("--card", isDark ? "135 7% 13%" : "0 0% 100%"),
    readRawVar("--border", isDark ? "130 8% 22%" : "100 9% 90%"),
    readRawVar("--muted", isDark ? "130 6% 18%" : "100 12% 91%"),
  ].join("|");
}

function subscribeTheme(callback: () => void) {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style"],
  });
  return () => observer.disconnect();
}

function colorsFromKey(key: string): ThemeColors {
  const [
    mode,
    primary,
    secondary,
    background,
    foreground,
    success,
    card,
    border,
    muted,
  ] = key.split("|");

  return {
    isDark: mode === "dark",
    primary: asHsl(primary),
    secondary: asHsl(secondary),
    background: asHsl(background),
    foreground: asHsl(foreground),
    success: asHsl(success),
    card: asHsl(card),
    border: asHsl(border),
    muted: asHsl(muted),
  };
}

export function useThemeColors(): ThemeColors {
  const key = useSyncExternalStore(subscribeTheme, snapshotKey, () => SERVER_KEY);
  return useMemo(() => colorsFromKey(key), [key]);
}
