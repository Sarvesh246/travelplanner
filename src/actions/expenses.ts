"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ExpenseSplitMode } from "@prisma/client";
import { validateCustomSplit, SplitParticipant } from "@/lib/expense-splits";
import { expenseToClientJson } from "@/lib/serialize/prisma-json";
import {
  assertActiveTripMembers,
  assertCanContribute,
  getAuthUser,
} from "@/lib/auth/trip-permissions";
import { logAuditEvent } from "@/lib/observability/audit";

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

function assertPositiveAmount(value: number | undefined, label: string) {
  if (value === undefined) return;
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
}

function assertUniqueParticipants(shares: ShareInput[]) {
  const ids = shares.map((share) => share.userId.trim()).filter(Boolean);
  if (ids.length !== shares.length) {
    throw new Error("Every participant must be a trip member");
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error("Each participant can only be added once");
  }
  return ids;
}

function revalidateExpenseViews(tripId: string) {
  revalidatePath(`/trips/${tripId}/expenses`);
  revalidatePath(`/trips/${tripId}/overview`);
}

function changedFieldKeys<T extends Record<string, unknown>>(input: Partial<T>) {
  return Object.keys(input).filter(
    (key) => input[key as keyof T] !== undefined
  );
}

export async function createExpense(tripId: string, input: CreateExpenseInput) {
  const user = await getAuthUser();
  await assertCanContribute(tripId, user.id);

  if (!input.title?.trim()) throw new Error("Title is required");
  assertPositiveAmount(input.totalAmount, "Amount");
  if (input.shares.length === 0) throw new Error("At least one participant required");

  const participantIds = assertUniqueParticipants(input.shares);
  await assertActiveTripMembers(tripId, [input.paidById, ...participantIds]);

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

  revalidateExpenseViews(tripId);
  await logAuditEvent({
    action: "expense.created",
    actorUserId: user.id,
    tripId,
    targetId: expense.id,
    summary: `Created expense ${expense.title}`,
    metadata: {
      totalAmount: input.totalAmount,
      splitMode: input.splitMode,
      paidById: input.paidById,
    },
  });
  return { expense: expenseToClientJson(expense) };
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
  const existing = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { shares: true },
  });
  if (!existing) throw new Error("Expense not found");
  await assertCanContribute(existing.tripId, user.id);

  const nextSplitMode = input.splitMode ?? existing.splitMode;
  const nextTotal = input.totalAmount ?? Number(existing.totalAmount);
  const nextPaidById = input.paidById ?? existing.paidById;

  if (input.title !== undefined && !input.title.trim()) throw new Error("Title is required");
  assertPositiveAmount(input.totalAmount, "Amount");

  if (input.paidById !== undefined || input.shares !== undefined) {
    const participantIds = input.shares ? assertUniqueParticipants(input.shares) : [];
    await assertActiveTripMembers(existing.tripId, [nextPaidById, ...participantIds]);
  }

  if (input.shares && input.shares.length === 0) {
    throw new Error("At least one participant required");
  }

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
        ...(input.title !== undefined && { title: input.title.trim() }),
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
      const previousShares = new Map(
        existing.shares.map((share) => [share.userId, { hasPaid: share.hasPaid, paidAt: share.paidAt }])
      );
      await tx.expenseShare.deleteMany({ where: { expenseId } });
      await tx.expenseShare.createMany({
        data: input.shares.map((s) => {
          const previous = previousShares.get(s.userId);
          return {
            expenseId,
            userId: s.userId,
            weight: nextSplitMode === "WEIGHTED" ? (s.weight ?? 1) : null,
            customAmount: nextSplitMode === "CUSTOM" ? (s.customAmount ?? 0) : null,
            hasPaid: s.userId === nextPaidById ? true : previous?.hasPaid ?? false,
            paidAt:
              s.userId === nextPaidById
                ? previous?.paidAt ?? new Date()
                : (previous?.paidAt ?? null),
          };
        }),
      });
    }
  });

  revalidateExpenseViews(existing.tripId);
  await logAuditEvent({
    action: "expense.updated",
    actorUserId: user.id,
    tripId: existing.tripId,
    targetId: expenseId,
    summary: `Updated expense ${input.title?.trim() || existing.title}`,
    metadata: {
      changedFields: changedFieldKeys(input),
      splitMode: nextSplitMode,
      totalAmount: nextTotal,
      paidById: nextPaidById,
    },
  });
}

export async function deleteExpense(expenseId: string) {
  const user = await getAuthUser();
  const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!existing) throw new Error("Expense not found");
  await assertCanContribute(existing.tripId, user.id);

  await prisma.expense.update({
    where: { id: expenseId },
    data: { deletedAt: new Date() },
  });
  revalidateExpenseViews(existing.tripId);
  await logAuditEvent({
    action: "expense.deleted",
    actorUserId: user.id,
    tripId: existing.tripId,
    targetId: expenseId,
    summary: `Archived expense ${existing.title}`,
  });
}

export async function restoreExpense(expenseId: string) {
  const user = await getAuthUser();
  const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!existing) throw new Error("Expense not found");
  await assertCanContribute(existing.tripId, user.id);

  await prisma.expense.update({
    where: { id: expenseId },
    data: { deletedAt: null },
  });
  revalidateExpenseViews(existing.tripId);
  await logAuditEvent({
    action: "expense.restored",
    actorUserId: user.id,
    tripId: existing.tripId,
    targetId: expenseId,
    summary: `Restored expense ${existing.title}`,
  });
}

export async function markSharePaid(shareId: string, hasPaid: boolean) {
  const user = await getAuthUser();
  const share = await prisma.expenseShare.findUnique({
    where: { id: shareId },
    include: { expense: true },
  });
  if (!share) throw new Error("Share not found");
  await assertCanContribute(share.expense.tripId, user.id);

  await prisma.expenseShare.update({
    where: { id: shareId },
    data: {
      hasPaid,
      paidAt: hasPaid ? new Date() : null,
    },
  });

  revalidateExpenseViews(share.expense.tripId);
  await logAuditEvent({
    action: "expense.share-paid.updated",
    actorUserId: user.id,
    tripId: share.expense.tripId,
    targetId: share.expenseId,
    targetUserId: share.userId,
    summary: `${hasPaid ? "Marked" : "Unmarked"} share as paid for ${share.expense.title}`,
    metadata: {
      shareId,
      hasPaid,
    },
  });
}
