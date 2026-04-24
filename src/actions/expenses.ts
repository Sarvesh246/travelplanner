"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ExpenseSplitMode } from "@prisma/client";
import { computeShares, validateCustomSplit, SplitParticipant } from "@/lib/expense-splits";

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

interface ShareInput {
  userId: string;
  weight?: number;
  customAmount?: number;
}

interface CreateExpenseInput {
  title: string;
  description?: string;
  category?: string;
  totalAmount: number;
  splitMode: ExpenseSplitMode;
  paidById: string;
  expenseDate?: string;
  receiptUrl?: string;
  shares: ShareInput[];
}

export async function createExpense(tripId: string, input: CreateExpenseInput) {
  const user = await getAuthUser();
  await assertTripMember(tripId, user.id);

  if (!input.title?.trim()) throw new Error("Title is required");
  if (input.totalAmount <= 0) throw new Error("Amount must be greater than 0");
  if (input.shares.length === 0) throw new Error("At least one participant required");

  const payerIsMember = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId: input.paidById } },
  });
  if (!payerIsMember) throw new Error("Payer must be a trip member");

  // Validate custom mode sums to total
  if (input.splitMode === "CUSTOM") {
    const participants: SplitParticipant[] = input.shares.map((s) => ({
      userId: s.userId,
      name: "",
      customAmount: s.customAmount ?? 0,
    }));
    const { valid } = validateCustomSplit(input.totalAmount, participants);
    if (!valid) throw new Error("Custom amounts must sum to the total");
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { currency: true },
  });

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        tripId,
        paidById: input.paidById,
        createdById: user.id,
        title: input.title.trim(),
        description: input.description,
        category: input.category,
        totalAmount: input.totalAmount,
        currency: trip?.currency ?? "USD",
        splitMode: input.splitMode,
        receiptUrl: input.receiptUrl,
        expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
      },
    });

    await tx.expenseShare.createMany({
      data: input.shares.map((s) => ({
        expenseId: created.id,
        userId: s.userId,
        weight: input.splitMode === "WEIGHTED" ? (s.weight ?? 1) : null,
        customAmount: input.splitMode === "CUSTOM" ? (s.customAmount ?? 0) : null,
        hasPaid: s.userId === input.paidById, // payer implicitly covered their own share
        paidAt: s.userId === input.paidById ? new Date() : null,
      })),
    });

    return created;
  });

  revalidatePath(`/trips/${tripId}/expenses`);
  return { expense };
}

interface UpdateExpenseInput {
  title?: string;
  description?: string;
  category?: string;
  totalAmount?: number;
  splitMode?: ExpenseSplitMode;
  paidById?: string;
  expenseDate?: string;
  receiptUrl?: string | null;
  status?: "PENDING" | "SETTLED" | "DISPUTED" | "CANCELLED";
  shares?: ShareInput[];
}

export async function updateExpense(expenseId: string, input: UpdateExpenseInput) {
  const user = await getAuthUser();
  const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!existing) throw new Error("Expense not found");
  await assertTripMember(existing.tripId, user.id);

  const nextSplitMode = input.splitMode ?? existing.splitMode;
  const nextTotal = input.totalAmount ?? Number(existing.totalAmount);

  if (input.shares && nextSplitMode === "CUSTOM") {
    const participants: SplitParticipant[] = input.shares.map((s) => ({
      userId: s.userId,
      name: "",
      customAmount: s.customAmount ?? 0,
    }));
    const { valid } = validateCustomSplit(nextTotal, participants);
    if (!valid) throw new Error("Custom amounts must sum to the total");
  }

  await prisma.$transaction(async (tx) => {
    await tx.expense.update({
      where: { id: expenseId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.totalAmount !== undefined && { totalAmount: input.totalAmount }),
        ...(input.splitMode !== undefined && { splitMode: input.splitMode }),
        ...(input.paidById !== undefined && { paidById: input.paidById }),
        ...(input.expenseDate && { expenseDate: new Date(input.expenseDate) }),
        ...(input.receiptUrl !== undefined && { receiptUrl: input.receiptUrl }),
        ...(input.status && { status: input.status }),
      },
    });

    if (input.shares) {
      await tx.expenseShare.deleteMany({ where: { expenseId } });
      await tx.expenseShare.createMany({
        data: input.shares.map((s) => ({
          expenseId,
          userId: s.userId,
          weight: nextSplitMode === "WEIGHTED" ? (s.weight ?? 1) : null,
          customAmount: nextSplitMode === "CUSTOM" ? (s.customAmount ?? 0) : null,
        })),
      });
    }
  });

  revalidatePath(`/trips/${existing.tripId}/expenses`);
}

export async function deleteExpense(expenseId: string) {
  const user = await getAuthUser();
  const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!existing) throw new Error("Expense not found");
  await assertTripMember(existing.tripId, user.id);

  await prisma.expense.update({
    where: { id: expenseId },
    data: { deletedAt: new Date() },
  });
  revalidatePath(`/trips/${existing.tripId}/expenses`);
}

export async function markSharePaid(shareId: string, hasPaid: boolean) {
  const user = await getAuthUser();
  const share = await prisma.expenseShare.findUnique({
    where: { id: shareId },
    include: { expense: true },
  });
  if (!share) throw new Error("Share not found");
  await assertTripMember(share.expense.tripId, user.id);

  await prisma.expenseShare.update({
    where: { id: shareId },
    data: {
      hasPaid,
      paidAt: hasPaid ? new Date() : null,
    },
  });

  revalidatePath(`/trips/${share.expense.tripId}/expenses`);
}
