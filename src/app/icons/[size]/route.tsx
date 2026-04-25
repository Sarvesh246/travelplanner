import { ImageResponse } from "next/og";
import { BeaconPwaIconImage } from "@/lib/beacon-pwa-icon";

/** Node.js — Edge bundle for `ImageResponse` + Satori exceeds Vercel's 1 MB Edge limit. */
export const runtime = "nodejs";

const SIZES = [32, 180, 192, 512] as const;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ size: string }> }
) {
  const { size: raw } = await ctx.params;
  const size = Number.parseInt(raw, 10);
  if (!Number.isFinite(size) || !SIZES.includes(size as (typeof SIZES)[number])) {
    return new Response("Not Found", { status: 404 });
  }

  const response = new ImageResponse(
    <BeaconPwaIconImage size={size} />,
    {
      width: size,
      height: size,
    }
  );
  response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return response;
}
