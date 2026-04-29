import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface AuditLogInput {
  action: string;
  actorUserId?: string | null;
  tripId?: string | null;
  targetUserId?: string | null;
  targetId?: string | null;
  summary?: string | null;
  metadata?: Prisma.InputJsonObject | null;
}

export async function logAuditEvent(input: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId ?? null,
        tripId: input.tripId ?? null,
        targetUserId: input.targetUserId ?? null,
        targetId: input.targetId ?? null,
        summary: input.summary ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write audit log", {
      action: input.action,
      tripId: input.tripId ?? null,
      targetUserId: input.targetUserId ?? null,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
