import { NextResponse } from "next/server";

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 3) {
    return NextResponse.json([]);
  }

  const params = new URLSearchParams({
    q: query.slice(0, 120),
    format: "jsonv2",
    addressdetails: "1",
    limit: "5",
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params}`, {
      headers: {
        Accept: "application/json",
        Referer: appUrl,
        "User-Agent": `Beacon Trip Planner (${appUrl})`,
      },
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Location search is unavailable" },
        { status: 502 }
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { error: "Location search is unavailable" },
      { status: 502 }
    );
  }
}
