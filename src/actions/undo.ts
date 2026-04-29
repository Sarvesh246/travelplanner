"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { getAuthUser } from "@/lib/auth/trip-permissions";

const UNDO_TTL_MS = 60 * 1000;

export async function issueUndoToken(input: {
  tripId: string;
  kind: string;
  payload: Record<string, unknown>;
}) {
  const user = await getAuthUser();
  const expiresAt = new Date(Date.now() + UNDO_TTL_MS);
  const row = await prisma.undoToken.create({
    data: {
      actorUserId: user.id,
      tripId: input.tripId,
      kind: input.kind,
      payload: input.payload as object,
      expiresAt,
    },
  });
  return { tokenId: row.id, expiresAt: row.expiresAt.toISOString() };
}

function revalidateTrip(tripId: string) {
  revalidatePath(`/trips/${tripId}/members`);
  revalidatePath(`/trips/${tripId}/overview`);
  revalidatePath(`/trips/${tripId}/supplies`);
  revalidatePath(`/trips/${tripId}/expenses`);
  revalidatePath(`/dashboard`);
  revalidateTag(`trip-${tripId}`, "max");
}

export async function performUndo(tokenId: string) {
  const user = await getAuthUser();
  const token = await prisma.undoToken.findUnique({ where: { id: tokenId } });
  if (!token || token.consumedAt) {
    throw new Error("This undo link is no longer valid");
  }
  if (token.actorUserId !== user.id) {
    throw new Error("You can only undo your own actions");
  }
  if (token.expiresAt < new Date()) {
    throw new Error("The undo window has expired");
  }

  const payload = token.payload as Record<string, unknown>;

  await prisma.$transaction(async (tx) => {
    switch (token.kind) {
      case "MEMBER_RESTORE": {
        const memberId = payload.memberId as string;
        const m = await tx.tripMember.findUnique({ where: { id: memberId } });
        if (!m || m.tripId !== token.tripId) throw new Error("Member no longer available");
        await tx.tripMember.update({
          where: { id: memberId },
          data: { status: "ACTIVE" },
        });
        break;
      }
      case "INVITE_RESTORE": {
        const inviteId = payload.inviteId as string;
        const inv = await tx.tripInvite.findUnique({ where: { id: inviteId } });
        if (!inv || inv.tripId !== token.tripId) throw new Error("Invite no longer available");
        await tx.tripInvite.update({
          where: { id: inviteId },
          data: { status: "PENDING" },
        });
        break;
      }
      case "SUPPLY_RESTORE": {
        const itemId = payload.itemId as string;
        const snap = payload.snapshot as Record<string, unknown>;
        const existing = await tx.supplyItem.findUnique({ where: { id: itemId } });
        if (!existing || existing.tripId !== token.tripId) throw new Error("Item no longer available");
        await tx.supplyItem.update({
          where: { id: itemId },
          data: {
            name: snap.name as string,
            category: snap.category as string | null | undefined,
            description: snap.description as string | null | undefined,
            quantityNeeded: snap.quantityNeeded as number,
            quantityOwned: snap.quantityOwned as number,
            quantityRemaining: snap.quantityRemaining as number,
            estimatedCost: snap.estimatedCost as never,
            actualCost: snap.actualCost as never,
            whoBringsId: snap.whoBringsId as string | null | undefined,
            whoBoughtId: snap.whoBoughtId as string | null | undefined,
            status: snap.status as never,
            notes: snap.notes as string | null | undefined,
          },
        });
        break;
      }
      case "TRIP_PATCH_RESTORE": {
        const snapshot = payload.snapshot as Record<string, unknown>;
        await tx.trip.update({
          where: { id: token.tripId },
          data: {
            name: snapshot.name as string,
            description: snapshot.description as string | null | undefined,
            startDate: snapshot.startDate ? new Date(snapshot.startDate as string) : null,
            endDate: snapshot.endDate ? new Date(snapshot.endDate as string) : null,
            currency: snapshot.currency as string,
            budgetTarget: snapshot.budgetTarget as never,
            estimatedCostOverride: snapshot.estimatedCostOverride as never,
            status: snapshot.status as never,
            coverImageUrl: snapshot.coverImageUrl as string | null | undefined,
          },
        });
        break;
      }
      default:
        throw new Error("Unknown undo operation");
    }

    await tx.undoToken.update({
      where: { id: tokenId },
      data: { consumedAt: new Date() },
    });
  });

  revalidateTrip(token.tripId);
  return { ok: true };
}
