import type { ApproxUserLocation } from "@/lib/weather/types";

const IPAPI_BASE_URL = "https://ipapi.co";
const REQUEST_TIMEOUT_MS = 1_500;

function firstHeaderValue(value: string | null): string | null {
  if (!value?.trim()) return null;
  return value.split(",")[0]?.trim() ?? null;
}

function normalizeClientIp(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;

  const raw = value.trim();
  const cleaned = raw.startsWith("::ffff:") ? raw.slice(7) : raw;

  if (
    cleaned === "::1" ||
    cleaned === "127.0.0.1" ||
    cleaned === "localhost" ||
    cleaned.startsWith("10.") ||
    cleaned.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(cleaned) ||
    cleaned.startsWith("fc") ||
    cleaned.startsWith("fd") ||
    cleaned.startsWith("fe80:")
  ) {
    return null;
  }

  return cleaned;
}

export function getClientIpFromHeaders(headersLike: Headers): string | null {
  return normalizeClientIp(
    firstHeaderValue(headersLike.get("x-forwarded-for")) ??
      firstHeaderValue(headersLike.get("cf-connecting-ip")) ??
      firstHeaderValue(headersLike.get("x-real-ip"))
  );
}

export async function getApproxUserLocationFromIp(
  input?: Headers | string | null
): Promise<ApproxUserLocation | null> {
  const ip =
    typeof input === "string" || input == null
      ? normalizeClientIp(input)
      : getClientIpFromHeaders(input);

  if (!ip) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${IPAPI_BASE_URL}/${encodeURIComponent(ip)}/json/`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      latitude?: unknown;
      longitude?: unknown;
      city?: unknown;
      region?: unknown;
      error?: unknown;
    };

    if (payload.error) return null;

    const lat = Number(payload.latitude);
    const lon = Number(payload.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }

    return {
      city: typeof payload.city === "string" ? payload.city : undefined,
      region: typeof payload.region === "string" ? payload.region : undefined,
      lat,
      lon,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
