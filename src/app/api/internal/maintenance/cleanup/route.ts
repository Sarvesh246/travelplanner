import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { reportServerError } from "@/lib/observability/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (cronSecret) {
    return bearer === cronSecret;
  }

  return request.headers.get("x-vercel-cron") === "1";
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  try {
    const [
      expiredInvites,
      staleInvites,
      oldRateLimits,
      oldErrorLogs,
      oldAuditLogs,
    ] = await prisma.$transaction([
      prisma.tripInvite.updateMany({
        where: {
          status: "PENDING",
          expiresAt: { lt: now },
        },
        data: { status: "EXPIRED" },
      }),
      prisma.tripInvite.deleteMany({
        where: {
          status: { in: ["ACCEPTED", "DECLINED", "EXPIRED", "REVOKED"] },
          updatedAt: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.rateLimitEvent.deleteMany({
        where: {
          createdAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.appErrorLog.deleteMany({
        where: {
          createdAt: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.auditLog.deleteMany({
        where: {
          createdAt: { lt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      expiredInvites: expiredInvites.count,
      deletedInvites: staleInvites.count,
      deletedRateLimitEvents: oldRateLimits.count,
      deletedErrorLogs: oldErrorLogs.count,
      deletedAuditLogs: oldAuditLogs.count,
      ranAt: now.toISOString(),
    });
  } catch (error) {
    await reportServerError({
      source: "maintenance.cleanup",
      error,
    });
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
