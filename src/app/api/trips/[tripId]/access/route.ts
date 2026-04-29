import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, reason: "signed_out" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { externalId: user.id },
    select: { id: true },
  });

  if (!dbUser) {
    return NextResponse.json(
      { ok: false, reason: "no_profile" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, deletedAt: true },
  });

  if (!trip || trip.deletedAt) {
    return NextResponse.json(
      { ok: false, reason: "trip_unavailable" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const membership = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId: dbUser.id } },
    select: { role: true, status: true },
  });

  if (!membership || membership.status !== "ACTIVE") {
    return NextResponse.json(
      { ok: false, reason: "access_revoked" },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { ok: true, role: membership.role },
    { headers: { "Cache-Control": "no-store" } }
  );
}
