import { unstable_cache } from "next/cache";
import { compareDateKeys, dateKeyFromDateLike, parseDateKey } from "@/lib/dates/date-key";
import type { WeatherSnapshot, WeatherState } from "@/lib/weather/types";

const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
const REQUEST_TIMEOUT_MS = 1_500;
const CURRENT_REVALIDATE_SECONDS = 60 * 15;
const FORECAST_REVALIDATE_SECONDS = 60 * 30;

type CurrentWeatherPayload = {
  weather?: Array<{ main?: string; description?: string; icon?: string }>;
  main?: { temp?: number };
  name?: string;
  sys?: { country?: string };
};

export type ForecastPayload = {
  city?: { timezone?: number; name?: string; country?: string };
  list?: Array<{
    dt?: number;
    main?: { temp?: number };
    weather?: Array<{ main?: string; description?: string; icon?: string }>;
  }>;
};

function getApiKey(): string | null {
  return process.env.OPENWEATHER_API_KEY?.trim() || null;
}

function roundCoord(value: number): string {
  return value.toFixed(3);
}

function buildLocationLabel(name?: string, country?: string): string | null {
  if (!name && !country) return null;
  if (name && country) return `${name}, ${country}`;
  return name ?? country ?? null;
}

function shortConditionLabel(
  weather: { main?: string; description?: string; icon?: string } | undefined
): string {
  const label = weather?.main?.trim() || weather?.description?.trim() || "Weather";
  return label.length > 18 ? `${label.slice(0, 17)}…` : label;
}

function toDateKeyWithOffset(unixSeconds: number, offsetSeconds: number): string {
  const shifted = new Date((unixSeconds + offsetSeconds) * 1000);
  return [
    shifted.getUTCFullYear(),
    `${shifted.getUTCMonth() + 1}`.padStart(2, "0"),
    `${shifted.getUTCDate()}`.padStart(2, "0"),
  ].join("-");
}

function localHourWithOffset(unixSeconds: number, offsetSeconds: number): number {
  const shifted = new Date((unixSeconds + offsetSeconds) * 1000);
  return shifted.getUTCHours();
}

async function fetchOpenWeatherJson<T>(path: string, revalidateSeconds: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OPENWEATHER_BASE_URL}${path}`, {
      method: "GET",
      signal: controller.signal,
      next: { revalidate: revalidateSeconds },
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`OpenWeather responded with HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchCurrentWeatherPayload(lat: number, lon: number): Promise<CurrentWeatherPayload> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    units: "imperial",
    appid: apiKey,
  });

  return fetchOpenWeatherJson<CurrentWeatherPayload>(
    `/weather?${params.toString()}`,
    CURRENT_REVALIDATE_SECONDS
  );
}

async function fetchForecastPayload(lat: number, lon: number): Promise<ForecastPayload> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    units: "imperial",
    appid: apiKey,
  });

  return fetchOpenWeatherJson<ForecastPayload>(
    `/forecast?${params.toString()}`,
    FORECAST_REVALIDATE_SECONDS
  );
}

export function normalizeCurrentWeather(payload: CurrentWeatherPayload): WeatherSnapshot | null {
  const weather = payload.weather?.[0];
  const tempF = payload.main?.temp;
  const iconCode = weather?.icon;
  const roundedTemp = typeof tempF === "number" ? Math.round(tempF) : null;

  if (roundedTemp == null || !iconCode) {
    return null;
  }

  return {
    tempF: roundedTemp,
    conditionShort: shortConditionLabel(weather),
    iconCode,
    forecastDate: new Date().toISOString().slice(0, 10),
    locationLabel: buildLocationLabel(payload.name, payload.sys?.country),
  };
}

export function forecastDateKeyExtents(payload: ForecastPayload): { minKey: string; maxKey: string } | null {
  const timezoneOffset = payload.city?.timezone ?? 0;
  const keys =
    payload.list?.flatMap((entry) =>
      typeof entry.dt === "number" ? [toDateKeyWithOffset(entry.dt, timezoneOffset)] : []
    ) ?? [];
  if (!keys.length) return null;

  keys.sort(compareDateKeys);
  const minKey = keys[0]!;
  const maxKey = keys[keys.length - 1]!;
  return { minKey, maxKey };
}

export function forecastGapMessage(payload: ForecastPayload, targetDateKey: string): string {
  const extents = forecastDateKeyExtents(payload);
  if (!extents) {
    return "Forecast unavailable here.";
  }

  if (compareDateKeys(targetDateKey, extents.minKey) < 0) {
    return "Before this Outlook window.";
  }

  if (compareDateKeys(targetDateKey, extents.maxKey) > 0) {
    const thru = utcShortMonthDayFromKey(extents.maxKey);
    return `Past ~5-day Outlook (${thru}).`;
  }

  return "No midday Outlook step.";
}

function utcShortMonthDayFromKey(dateKey: string): string {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return dateKey;

  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function pickForecastEntryForDate(payload: ForecastPayload, targetDateKey: string): WeatherSnapshot | null {
  const timezoneOffset = payload.city?.timezone ?? 0;
  const sameDayEntries =
    payload.list?.filter((entry) => {
      if (!entry.dt) return false;
      return toDateKeyWithOffset(entry.dt, timezoneOffset) === targetDateKey;
    }) ?? [];

  if (sameDayEntries.length === 0) return null;

  const best = sameDayEntries.reduce((currentBest, entry) => {
    const dt = entry.dt;
    if (typeof dt !== "number") return currentBest;
    const distance = Math.abs(localHourWithOffset(dt, timezoneOffset) - 12);

    if (!currentBest) {
      return { entry, distance };
    }

    return distance < currentBest.distance ? { entry, distance } : currentBest;
  }, null as { entry: NonNullable<ForecastPayload["list"]>[number]; distance: number } | null);

  const selected = best?.entry;
  const weather = selected?.weather?.[0];
  const tempF = selected?.main?.temp;
  const iconCode = weather?.icon;
  const roundedTemp = typeof tempF === "number" ? Math.round(tempF) : null;

  if (typeof selected?.dt !== "number" || roundedTemp == null || !iconCode) {
    return null;
  }

  return {
    tempF: roundedTemp,
    conditionShort: shortConditionLabel(weather),
    iconCode,
    forecastDate: targetDateKey,
    locationLabel: buildLocationLabel(payload.city?.name, payload.city?.country),
  };
}

async function getCachedCurrentWeather(lat: number, lon: number): Promise<CurrentWeatherPayload> {
  const latKey = roundCoord(lat);
  const lonKey = roundCoord(lon);
  const cached = unstable_cache(
    () => fetchCurrentWeatherPayload(Number(latKey), Number(lonKey)),
    ["openweather-current", latKey, lonKey],
    { revalidate: CURRENT_REVALIDATE_SECONDS }
  );

  return cached();
}

async function getCachedForecast(lat: number, lon: number): Promise<ForecastPayload> {
  const latKey = roundCoord(lat);
  const lonKey = roundCoord(lon);
  const cached = unstable_cache(
    () => fetchForecastPayload(Number(latKey), Number(lonKey)),
    ["openweather-forecast", latKey, lonKey],
    { revalidate: FORECAST_REVALIDATE_SECONDS }
  );

  return cached();
}

export async function getCurrentWeatherByCoords(lat: number, lon: number): Promise<WeatherState> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { state: "empty", message: "Location unavailable" };
  }

  try {
    const payload = await getCachedCurrentWeather(lat, lon);
    const normalized = normalizeCurrentWeather(payload);
    if (!normalized) {
      return { state: "empty", message: "Current weather unavailable" };
    }

    return { state: "ready", data: normalized };
  } catch {
    return { state: "error", message: "Current weather unavailable" };
  }
}

export async function getForecastForStop(
  lat: number,
  lon: number,
  date: Date | string
): Promise<WeatherState> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { state: "empty", message: "Add location for weather" };
  }

  const dateKey = dateKeyFromDateLike(date);
  if (!dateKey) {
    return { state: "empty", message: "Set date for forecast" };
  }

  try {
    const payload = await getCachedForecast(lat, lon);
    const snapshot = pickForecastEntryForDate(payload, dateKey);
    if (!snapshot) {
      return { state: "empty", message: forecastGapMessage(payload, dateKey) };
    }

    return { state: "ready", data: snapshot };
  } catch {
    return { state: "error", message: "Forecast unavailable" };
  }
}
