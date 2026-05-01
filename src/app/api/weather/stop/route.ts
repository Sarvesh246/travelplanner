import { NextResponse } from "next/server";
import { isDateKey } from "@/lib/dates/date-key";
import { getForecastForStop } from "@/lib/weather/openweather";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const date = searchParams.get("date")?.trim() ?? "";

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !isDateKey(date)) {
    return NextResponse.json(
      { state: "error", message: "Invalid weather request" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const weather = await getForecastForStop(lat, lon, date);
  return NextResponse.json(weather, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
