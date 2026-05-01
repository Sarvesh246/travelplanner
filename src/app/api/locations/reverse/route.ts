import { NextResponse } from "next/server";
import { reverseGeocodeLabel } from "@/lib/location/nominatim";

export const runtime = "nodejs";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const label = await reverseGeocodeLabel(lat, lon);

  if (!label) {
    return new NextResponse(null, { status: 204, headers: CACHE_HEADERS });
  }

  return NextResponse.json({ label }, { headers: CACHE_HEADERS });
}
