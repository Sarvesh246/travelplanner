"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CommentableType } from "@prisma/client";
import {
  assertCanContribute,
  assertCanManage,
  getAuthUser,
} from "@/lib/auth/trip-permissions";

interface CreateCommentInput {
  entityType: CommentableType;
  entityId: string;
  body: string;
  threadParentId?: string;
}

// Look up the parent trip for a given entity so we can check membership and revalidate.
async function resolveEntity(entityType: CommentableType, entityId: string) {
  switch (entityType) {
    case "TRIP": {
      const trip = await prisma.trip.findUnique({ where: { id: entityId }, select: { id: true } });
      if (!trip) throw new Error("Entity not found");
      return { tripId: trip.id, fk: { tripId: entityId } };
    }
    case "STOP": {
      const stop = await prisma.stop.findUnique({ where: { id: entityId }, select: { tripId: true } });
      if (!stop) throw new Error("Entity not found");
      return { tripId: stop.tripId, fk: { stopId: entityId } };
    }
    case "ACTIVITY": {
      const activity = await prisma.activity.findUnique({
        where: { id: entityId },
        include: { stop: { select: { tripId: true } } },
      });
      if (!activity) throw new Error("Entity not found");
      return { tripId: activity.stop.tripId, fk: { activityId: entityId } };
    }
    case "EXPENSE": {
      const expense = await prisma.expense.findUnique({ where: { id: entityId }, select: { tripId: true } });
      if (!expense) throw new Error("Entity not found");
      return { tripId: expense.tripId, fk: { expenseId: entityId } };
    }
    case "SUPPLY_ITEM": {
      const supply = await prisma.supplyItem.findUnique({ where: { id: entityId }, select: { tripId: true } });
      if (!supply) throw new Error("Entity not found");
      return { tripId: supply.tripId, fk: { supplyItemId: entityId } };
    }
    case "VOTE": {
      const vote = await prisma.vote.findUnique({ where: { id: entityId }, select: { tripId: true } });
      if (!vote) throw new Error("Entity not found");
      return { tripId: vote.tripId, fk: { voteId: entityId } };
    }
    case "STAY": {
      const stay = await prisma.stay.findUnique({
        where: { id: entityId },
        include: { stop: { select: { tripId: true } } },
      });
      if (!stay) throw new Error("Entity not found");
      return { tripId: stay.stop.tripId, fk: {} };
    }
  }
}

function revalidateForEntity(tripId: string, entityType: CommentableType) {
  const base = `/trips/${tripId}`;
  const byEntity: Record<CommentableType, string> = {
    TRIP: `${base}/overview`,
    STOP: `${base}/itinerary`,
    STAY: `${base}/itinerary`,
    ACTIVITY: `${base}/itinerary`,
    EXPENSE: `${base}/expenses`,
    SUPPLY_ITEM: `${base}/supplies`,
    VOTE: `${base}/votes`,
  };
  revalidatePath(byEntity[entityType]);
}

async function tripIdForComment(comment: {
  tripId: string | null;
  entityType: CommentableType;
  entityId: string;
}): Promise<string> {
  if (comment.tripId) return comment.tripId;
  const { tripId } = await resolveEntity(comment.entityType, comment.entityId);
  return tripId;
}

export async function createComment(input: CreateCommentInput) {
  const user = await getAuthUser();
  if (!input.body?.trim()) throw new Error("Comment body is required");

  const { tripId, fk } = await resolveEntity(input.entityType, input.entityId);
  await assertCanContribute(tripId, user.id);

  const comment = await prisma.comment.create({
    data: {
      authorId: user.id,
      entityType: input.entityType,
      entityId: input.entityId,
      tripId,
      ...fk,
      threadParentId: input.threadParentId,
      body: input.body.trim(),
    },
  });

  revalidateForEntity(tripId, input.entityType);
  return { comment };
}

export async function updateComment(commentId: string, body: string) {
  const user = await getAuthUser();
  if (!body?.trim()) throw new Error("Comment body is required");

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comment not found");
  if (comment.authorId !== user.id) throw new Error("You can only edit your own comments");

  const tripId = await tripIdForComment(comment);
  await assertCanContribute(tripId, user.id);

  await prisma.comment.update({
    where: { id: commentId },
    data: { body: body.trim(), editedAt: new Date() },
  });

  if (comment.tripId) revalidateForEntity(comment.tripId, comment.entityType);
}

export async function deleteComment(commentId: string) {
  const user = await getAuthUser();
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comment not found");

  const tripId = await tripIdForComment(comment);
  if (comment.authorId === user.id) {
    await assertCanContribute(tripId, user.id);
  } else {
    await assertCanManage(tripId, user.id);
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });

  if (comment.tripId) revalidateForEntity(comment.tripId, comment.entityType);
}
