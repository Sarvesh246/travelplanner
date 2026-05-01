import { cn } from "@/lib/utils";

/** OpenWeather icons are prefixed with numeric condition groups (02d → 02). */
function iconGroup(iconCode: string): number | null {
  const n = Number.parseInt(iconCode, 10);
  return Number.isFinite(n) ? n : null;
}

/** Semantic, low-contrast pill backgrounds aligned with outdoors neutrals. */
export function weatherToneFromIcon(iconCode: string): {
  tone: "clear" | "cloudy" | "rain" | "snow" | "storm" | "mist" | "neutral";
  shell: string;
} {
  const g = iconGroup(iconCode) ?? -1;

  let toneKey: keyof typeof shells = "neutral";
  if (g === 1 || g === 2) toneKey = "clear";
  else if (g === 3 || g === 4) toneKey = "cloudy";
  else if (g >= 9 && g <= 10) toneKey = "rain";
  else if (g === 11) toneKey = "storm";
  else if (g === 13) toneKey = "snow";
  else if (g === 50 || (g >= 45 && g <= 48)) toneKey = "mist";

  return { tone: toneKey, shell: shells[toneKey] };
}

const shells = {
  clear: cn(
    "border-[hsl(var(--primary)/0.26)] bg-[hsl(var(--primary)/0.08)] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)]"
  ),
  cloudy: cn(
    "border-[hsl(var(--muted-foreground)/0.22)] bg-[hsl(var(--muted)/0.55)] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)]"
  ),
  rain: cn(
    "border-[hsl(var(--accent)/0.35)] bg-[hsl(var(--accent)/0.14)] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)]"
  ),
  snow: cn(
    "border-[hsl(var(--secondary)/0.35)] bg-[hsl(var(--secondary)/0.16)] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)]"
  ),
  storm: cn(
    "border-[hsl(var(--muted-foreground)/0.38)] bg-[hsl(var(--foreground)/0.06)] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06)]"
  ),
  mist: cn(
    "border-[hsl(var(--border)/0.85)] bg-[hsl(var(--muted)/0.72)] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)]"
  ),
  neutral: cn("border-[hsl(var(--border)/0.75)] bg-[hsl(var(--card)/0.82)] shadow-sm"),
} satisfies Record<
  string,
  string
>;
