"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { VoteTopicType } from "@prisma/client";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const dbUser = await prisma.user.findUnique({ where: { externalId: user.id } });
  if (!dbUser) throw new Error("User not found");
  return dbUser;
}

async function assertTripMember(tripId: string, userId: string) {
  const member = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId } },
  });
  if (!member || member.status !== "ACTIVE") throw new Error("Not a member");
  return member;
}

async function assertCanManage(tripId: string, userId: string) {
  const member = await assertTripMember(tripId, userId);
  if (!["OWNER", "ADMIN"].includes(member.role)) {
    throw new Error("Insufficient permissions");
  }
  return member;
}

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
  await assertTripMember(tripId, user.id);

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
  return { vote };
}

export async function castVote(voteId: string, optionIds: string[]) {
  const user = await getAuthUser();
  const vote = await prisma.vote.findUnique({
    where: { id: voteId },
    include: { options: { select: { id: true } } },
  });
  if (!vote) throw new Error("Vote not found");
  await assertTripMember(vote.tripId, user.id);

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
}

export async function deleteVote(voteId: string) {
  const user = await getAuthUser();
  const vote = await prisma.vote.findUnique({ where: { id: voteId } });
  if (!vote) throw new Error("Vote not found");
  await assertCanManage(vote.tripId, user.id);

  await prisma.vote.delete({ where: { id: voteId } });
  revalidatePath(`/trips/${vote.tripId}/votes`);
}
