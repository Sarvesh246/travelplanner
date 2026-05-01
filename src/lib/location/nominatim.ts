import { unstable_cache } from "next/cache";
import { getAppOrigin } from "@/lib/app-url";

const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const REQUEST_TIMEOUT_MS = 3000;

function roundCoord(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function truncateLabel(text: string, maxLen: number): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 1))}…`;
}

function buildLabelFromPayload(data: Record<string, unknown>): string | null {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const address = (data.address as Record<string, string | undefined> | undefined) ?? {};
  const locality =
    address.city ?? address.town ?? address.village ?? address.hamlet ?? address.suburb ?? address.county;
  const parts = [name, address.road, locality, address.state, address.country].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0
  );
  const unique = [...new Set(parts.map((p) => p.trim()))];
  const joined = unique.join(", ");
  if (!joined) return null;
  return truncateLabel(joined, 72);
}

async function fetchReverseGeocodeUncached(lat: number, lon: number): Promise<string | null> {
  const appUrl = getAppOrigin();
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lon),
    zoom: "14",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Referer: appUrl,
        "User-Agent": `Beacon Trip Planner (${appUrl})`,
      },
      signal: controller.signal,
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, unknown>;
    return buildLabelFromPayload(data);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Cached reverse geocode (rounded to ~110 m) to respect Nominatim usage limits.
 * Data © OpenStreetMap contributors — display attribution where shown.
 */
export async function reverseGeocodeLabel(lat: number, lon: number): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const latR = roundCoord(lat, 3);
  const lonR = roundCoord(lon, 3);

  return unstable_cache(
    async () => fetchReverseGeocodeUncached(latR, lonR),
    ["nominatim-reverse-v1", String(latR), String(lonR)],
    { revalidate: 86400 }
  )();
}
