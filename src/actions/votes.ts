"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { VoteTopicType } from "@prisma/client";
import {
  assertCanContribute,
  assertCanManage,
  getAuthUser,
} from "@/lib/auth/trip-permissions";
import { logAuditEvent } from "@/lib/observability/audit";

interface VoteOptionInput {
  label: string;
  dateStart?: string;
  dateEnd?: string;
}

interface CreateVoteInput {
  title: string;
  description?: string;
  topicType: VoteTopicType;
  allowMultiple?: boolean;
  isAnonymous?: boolean;
  deadline?: string;
  options: VoteOptionInput[];
}

export async function createVote(tripId: string, input: CreateVoteInput) {
  const user = await getAuthUser();
  await assertCanContribute(tripId, user.id);

  if (!input.title?.trim()) throw new Error("Title is required");
  if (input.options.length < 2) throw new Error("At least two options required");

  const vote = await prisma.$transaction(async (tx) => {
    const created = await tx.vote.create({
      data: {
        tripId,
        createdById: user.id,
        title: input.title.trim(),
        description: input.description,
        topicType: input.topicType,
        allowMultiple: input.allowMultiple ?? false,
        isAnonymous: input.isAnonymous ?? false,
        deadline: input.deadline ? new Date(input.deadline) : undefined,
      },
    });

    await tx.voteOption.createMany({
      data: input.options.map((o, idx) => ({
        voteId: created.id,
        label: o.label,
        dateStart: o.dateStart ? new Date(o.dateStart) : undefined,
        dateEnd: o.dateEnd ? new Date(o.dateEnd) : undefined,
        sortOrder: idx,
      })),
    });

    return created;
  });

  revalidatePath(`/trips/${tripId}/votes`);
  await logAuditEvent({
    action: "vote.created",
    actorUserId: user.id,
    tripId,
    targetId: vote.id,
    summary: `Created poll ${vote.title}`,
    metadata: {
      topicType: vote.topicType,
      optionCount: input.options.length,
      allowMultiple: vote.allowMultiple,
      isAnonymous: vote.isAnonymous,
    },
  });
  return { vote };
}

export async function castVote(voteId: string, optionIds: string[]) {
  const user = await getAuthUser();
  const vote = await prisma.vote.findUnique({
    where: { id: voteId },
    include: { options: { select: { id: true } } },
  });
  if (!vote) throw new Error("Vote not found");
  await assertCanContribute(vote.tripId, user.id);

  if (vote.status !== "OPEN") throw new Error("Vote is closed");
  if (vote.deadline && vote.deadline < new Date()) throw new Error("Vote has ended");

  const validIds = new Set(vote.options.map((o) => o.id));
  const sanitized = optionIds.filter((id) => validIds.has(id));

  if (!vote.allowMultiple && sanitized.length > 1) {
    throw new Error("Only one option allowed");
  }

  await prisma.$transaction(async (tx) => {
    await tx.voteResponse.deleteMany({
      where: { voteId, userId: user.id },
    });

    if (sanitized.length > 0) {
      await tx.voteResponse.createMany({
        data: sanitized.map((voteOptionId) => ({
          voteId,
          voteOptionId,
          userId: user.id,
        })),
      });
    }
  });

  revalidatePath(`/trips/${vote.tripId}/votes`);
  await logAuditEvent({
    action: "vote.cast",
    actorUserId: user.id,
    tripId: vote.tripId,
    targetId: voteId,
    summary:
      sanitized.length > 0
        ? `Voted on poll ${vote.title}`
        : `Cleared vote on poll ${vote.title}`,
    metadata: {
      selectedOptionIds: sanitized,
      selectedCount: sanitized.length,
    },
  });
}

export async function closeVote(voteId: string) {
  const user = await getAuthUser();
  const vote = await prisma.vote.findUnique({ where: { id: voteId } });
  if (!vote) throw new Error("Vote not found");
  await assertCanManage(vote.tripId, user.id);

  await prisma.vote.update({
    where: { id: voteId },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  revalidatePath(`/trips/${vote.tripId}/votes`);
  await logAuditEvent({
    action: "vote.closed",
    actorUserId: user.id,
    tripId: vote.tripId,
    targetId: voteId,
    summary: `Closed poll ${vote.title}`,
  });
}

export async function deleteVote(voteId: string) {
  const user = await getAuthUser();
  const vote = await prisma.vote.findUnique({ where: { id: voteId } });
  if (!vote) throw new Error("Vote not found");
  await assertCanManage(vote.tripId, user.id);

  await prisma.vote.delete({ where: { id: voteId } });
  revalidatePath(`/trips/${vote.tripId}/votes`);
  await logAuditEvent({
    action: "vote.deleted",
    actorUserId: user.id,
    tripId: vote.tripId,
    targetId: voteId,
    summary: `Deleted poll ${vote.title}`,
  });
}
